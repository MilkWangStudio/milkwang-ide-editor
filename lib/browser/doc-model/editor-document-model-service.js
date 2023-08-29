"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorDocumentModelServiceImpl = exports.EDITOR_DOC_OPTIONS_PREF_KEY = exports.EDITOR_DOCUMENT_MODEL_STORAGE = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const hash_calculate_1 = require("@opensumi/ide-core-common/lib/hash-calculate/hash-calculate");
const editor_document_model_1 = require("./editor-document-model");
const types_1 = require("./types");
exports.EDITOR_DOCUMENT_MODEL_STORAGE = new ide_core_browser_1.URI('editor-doc').withScheme(ide_core_browser_1.STORAGE_SCHEMA.SCOPE);
exports.EDITOR_DOC_OPTIONS_PREF_KEY = 'editor_doc_pref';
let EditorDocumentModelServiceImpl = class EditorDocumentModelServiceImpl extends ide_core_browser_1.WithEventBus {
    constructor() {
        super();
        this.editorDocModels = new Map();
        this.creatingEditorModels = new Map();
        this._modelsToDispose = new Set();
        this.preferredModelOptions = new Map();
        this._ready = new ide_core_browser_1.ReadyEvent();
        this._modelReferenceManager = new ide_core_browser_1.ReferenceManager((key) => {
            if (this._modelsToDispose.has(key)) {
                this._modelsToDispose.delete(key);
            }
            // this.getOrCreateModel 的第二个参数是 encoding, 实际上没地方能传进去
            // ReferenceManager 的构造参数 factory 只有一个入参
            return this.getOrCreateModel(key);
        });
        this._modelReferenceManager.onReferenceAllDisposed((key) => {
            this._delete(key);
        });
        this._modelReferenceManager.onInstanceCreated((model) => {
            this.eventBus.fire(new types_1.EditorDocumentModelCreationEvent({
                uri: model.uri,
                languageId: model.languageId,
                eol: model.eol,
                encoding: model.encoding,
                content: model.getText(),
                readonly: model.readonly,
                versionId: model.getMonacoModel().getVersionId(),
            }));
        });
        this.addDispose(this.preferenceService.onPreferenceChanged((e) => {
            if (e.preferenceName === 'editor.detectIndentation') {
                this.editorDocModels.forEach((m) => {
                    m.updateOptions({});
                });
            }
        }));
    }
    _delete(uri) {
        const modelDisposeDebounceTime = this.preferenceService.get('editor.modelDisposeTime', 3000);
        // debounce
        this._modelsToDispose.add(uri.toString());
        let timer = null;
        const disposer = this.addDispose({
            dispose: () => {
                if (timer) {
                    clearTimeout(timer);
                }
            },
        });
        timer = window.setTimeout(() => {
            disposer.dispose();
            timer = null;
            if (this._modelsToDispose.has(uri.toString())) {
                this._doDelete(uri.toString());
            }
        }, modelDisposeDebounceTime);
    }
    _doDelete(uri) {
        const doc = this.editorDocModels.get(uri);
        // dirty 的 document 不 dispose
        if (doc && (!doc.dirty || doc.disposeEvenDirty)) {
            doc.dispose();
            this.editorDocModels.delete(uri);
            return doc;
        }
        this._modelsToDispose.delete(uri);
    }
    async changeModelOptions(uri, options) {
        return this.onceReady(() => {
            if (this.preferredModelOptions.has(uri.toString())) {
                options = Object.assign(Object.assign({}, this.preferredModelOptions.get(uri.toString())), options);
            }
            this.preferredModelOptions.set(uri.toString(), options);
            const docRef = this.getModelReference(uri);
            if (docRef) {
                if (options.encoding && options.encoding !== docRef.instance.encoding) {
                    docRef.instance.updateEncoding(options.encoding);
                }
                if (options.languageId && options.languageId !== docRef.instance.languageId) {
                    docRef.instance.languageId = options.languageId;
                }
                if (options.eol && options.eol !== docRef.instance.eol) {
                    docRef.instance.eol = options.eol;
                }
                docRef.dispose();
            }
            return this.persistOptionsPreference();
        });
    }
    persistOptionsPreference() {
        return this.storage.set(exports.EDITOR_DOC_OPTIONS_PREF_KEY, JSON.stringify((0, ide_core_browser_1.mapToSerializable)(this.preferredModelOptions)));
    }
    async initialize() {
        this.storage = await this.getStorage(exports.EDITOR_DOCUMENT_MODEL_STORAGE);
        if (this.storage.get(exports.EDITOR_DOC_OPTIONS_PREF_KEY)) {
            try {
                this.preferredModelOptions = (0, ide_core_browser_1.serializableToMap)(JSON.parse(this.storage.get(exports.EDITOR_DOC_OPTIONS_PREF_KEY)));
            }
            catch (e) {
                this.logger.error(e);
            }
        }
        this._ready.ready();
    }
    async acceptExternalChange(e) {
        if (!this.hashCalculateService.initialized) {
            await this.hashCalculateService.initialize();
        }
        const doc = this.editorDocModels.get(e.payload.toString());
        if (doc) {
            if (doc.dirty) {
                // do nothing
            }
            else {
                const provider = await this.contentRegistry.getProvider(doc.uri);
                if (provider) {
                    if (provider.provideEditorDocumentModelContentMd5) {
                        const nextMd5 = await provider.provideEditorDocumentModelContentMd5(doc.uri, doc.encoding);
                        if (nextMd5 !== doc.getBaseContentMd5()) {
                            doc.updateContent(await this.contentRegistry.getContentForUri(doc.uri, doc.encoding), undefined, true);
                        }
                    }
                    else {
                        const content = await this.contentRegistry.getContentForUri(doc.uri, doc.encoding);
                        if (this.hashCalculateService.calculate(content) !== doc.getBaseContentMd5()) {
                            doc.updateContent(content, undefined, true);
                        }
                    }
                }
            }
        }
    }
    createModelReference(uri, reason) {
        return this._modelReferenceManager.getReference(uri.toString(), reason);
    }
    getModelReference(uri, reason) {
        return this._modelReferenceManager.getReferenceIfHasInstance(uri.toString(), reason);
    }
    getAllModels() {
        return Array.from(this.editorDocModels.values());
    }
    hasLanguage(langaugeId) {
        return this.getAllModels().findIndex((m) => m.languageId === langaugeId) !== -1;
    }
    async getOrCreateModel(uri, encoding) {
        if (this.editorDocModels.has(uri)) {
            return this.editorDocModels.get(uri);
        }
        return this.createModel(uri, encoding);
    }
    get onceReady() {
        this.initialize();
        return this._ready.onceReady.bind(this._ready);
    }
    createModel(uri, encoding) {
        // 防止异步重复调用
        if (!this.creatingEditorModels.has(uri)) {
            const promise = this.doCreateModel(uri, encoding).then((model) => {
                this.creatingEditorModels.delete(uri);
                return model;
            }, (e) => {
                this.creatingEditorModels.delete(uri);
                throw e;
            });
            this.creatingEditorModels.set(uri, promise);
        }
        return this.creatingEditorModels.get(uri);
    }
    async doCreateModel(uriString, encoding) {
        const uri = new ide_core_browser_1.URI(uriString);
        const provider = await this.contentRegistry.getProvider(uri);
        if (!provider) {
            throw new Error(`No document provider found for ${uri.toString()}`);
        }
        const [content, readonly, languageId, eol, alwaysDirty, closeAutoSave, disposeEvenDirty] = await Promise.all([
            provider.provideEditorDocumentModelContent(uri, encoding),
            provider.isReadonly ? provider.isReadonly(uri) : undefined,
            provider.preferLanguageForUri ? provider.preferLanguageForUri(uri) : undefined,
            provider.provideEOL ? provider.provideEOL(uri) : undefined,
            provider.isAlwaysDirty ? provider.isAlwaysDirty(uri) : false,
            provider.closeAutoSave ? provider.closeAutoSave(uri) : false,
            provider.disposeEvenDirty ? provider.disposeEvenDirty(uri) : false,
        ]);
        // 优先使用 preferred encoding，然后用 detected encoding
        if (!encoding && provider.provideEncoding) {
            encoding = await provider.provideEncoding(uri);
        }
        const savable = !!provider.saveDocumentModel;
        const model = this.injector.get(editor_document_model_1.EditorDocumentModel, [
            uri,
            content,
            {
                readonly,
                languageId,
                savable,
                eol,
                encoding,
                alwaysDirty,
                closeAutoSave,
                disposeEvenDirty,
            },
        ]);
        this.onceReady(() => {
            if (this.preferredModelOptions.has(uri.toString())) {
                const preferedOptions = this.preferredModelOptions.get(uri.toString());
                if (preferedOptions === null || preferedOptions === void 0 ? void 0 : preferedOptions.encoding) {
                    model.updateEncoding(preferedOptions.encoding);
                }
                if (preferedOptions === null || preferedOptions === void 0 ? void 0 : preferedOptions.eol) {
                    model.eol = preferedOptions.eol;
                }
                if (preferedOptions === null || preferedOptions === void 0 ? void 0 : preferedOptions.languageId) {
                    model.languageId = preferedOptions.languageId;
                }
            }
        });
        this.editorDocModels.set(uri.toString(), model);
        return model;
    }
    async saveEditorDocumentModel(uri, content, baseContent, changes, encoding, ignoreDiff, eol) {
        const provider = await this.contentRegistry.getProvider(uri);
        if (!provider) {
            throw new Error(`No document provider found for ${uri.toString()}`);
        }
        if (!provider.saveDocumentModel) {
            throw new Error(`The document provider of ${uri.toString()} does not have a save method`);
        }
        const result = await provider.saveDocumentModel(uri, content, baseContent, changes, encoding, ignoreDiff, eol);
        return result;
    }
    dispose() {
        super.dispose();
        this.getAllModels().forEach((model) => {
            model.getMonacoModel().dispose();
        });
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(types_1.IEditorDocumentModelContentRegistry),
    tslib_1.__metadata("design:type", Object)
], EditorDocumentModelServiceImpl.prototype, "contentRegistry", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(di_1.INJECTOR_TOKEN),
    tslib_1.__metadata("design:type", di_1.Injector)
], EditorDocumentModelServiceImpl.prototype, "injector", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.StorageProvider),
    tslib_1.__metadata("design:type", Function)
], EditorDocumentModelServiceImpl.prototype, "getStorage", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.ILogger),
    tslib_1.__metadata("design:type", Object)
], EditorDocumentModelServiceImpl.prototype, "logger", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.PreferenceService),
    tslib_1.__metadata("design:type", Object)
], EditorDocumentModelServiceImpl.prototype, "preferenceService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(hash_calculate_1.IHashCalculateService),
    tslib_1.__metadata("design:type", Object)
], EditorDocumentModelServiceImpl.prototype, "hashCalculateService", void 0);
tslib_1.__decorate([
    ide_core_browser_1.memoize,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], EditorDocumentModelServiceImpl.prototype, "initialize", null);
tslib_1.__decorate([
    (0, ide_core_browser_1.OnEvent)(types_1.EditorDocumentModelOptionExternalUpdatedEvent),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [types_1.EditorDocumentModelOptionExternalUpdatedEvent]),
    tslib_1.__metadata("design:returntype", Promise)
], EditorDocumentModelServiceImpl.prototype, "acceptExternalChange", null);
EditorDocumentModelServiceImpl = tslib_1.__decorate([
    (0, di_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [])
], EditorDocumentModelServiceImpl);
exports.EditorDocumentModelServiceImpl = EditorDocumentModelServiceImpl;
//# sourceMappingURL=editor-document-model-service.js.map