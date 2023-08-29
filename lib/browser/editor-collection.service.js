"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserDiffEditor = exports.BrowserCodeEditor = exports.BaseMonacoEditorWrapper = exports.insertSnippetWithMonacoEditor = exports.EditorCollectionServiceImpl = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const contextkey_1 = require("@opensumi/ide-core-browser/lib/contextkey");
const monaco_1 = require("@opensumi/ide-core-browser/lib/monaco");
const ide_core_common_1 = require("@opensumi/ide-core-common");
const ide_core_common_2 = require("@opensumi/ide-core-common");
const monaco = tslib_1.__importStar(require("@opensumi/monaco-editor-core/esm/vs/editor/editor.api"));
const configuration_1 = require("@opensumi/monaco-editor-core/esm/vs/platform/configuration/common/configuration");
const common_1 = require("../common");
const decoration_applier_1 = require("./decoration-applier");
const types_1 = require("./doc-model/types");
const feature_1 = require("./feature");
const converter_1 = require("./preference/converter");
const types_2 = require("./types");
const { removeUndefined } = ide_core_common_1.objects;
let EditorCollectionServiceImpl = class EditorCollectionServiceImpl extends ide_core_common_1.WithEventBus {
    get currentEditor() {
        return this._currentEditor;
    }
    constructor() {
        super();
        this._editors = new Set();
        this._diffEditors = new Set();
        this._onCodeEditorCreate = new ide_core_common_2.Emitter();
        this._onDiffEditorCreate = new ide_core_common_2.Emitter();
        this.onCodeEditorCreate = this._onCodeEditorCreate.event;
        this.onDiffEditorCreate = this._onDiffEditorCreate.event;
        this.addDispose(this.editorFeatureRegistry.onDidRegisterFeature((contribution) => {
            this._editors.forEach((editor) => {
                this.editorFeatureRegistry.runOneContribution(editor, contribution);
            });
        }));
    }
    createCodeEditor(dom, options, overrides) {
        const mergedOptions = Object.assign(Object.assign({}, (0, converter_1.getConvertedMonacoOptions)(this.configurationService).editorOptions), options);
        const monacoCodeEditor = this.monacoService.createCodeEditor(dom, mergedOptions, overrides);
        const editor = this.injector.get(BrowserCodeEditor, [monacoCodeEditor, options]);
        this._onCodeEditorCreate.fire(editor);
        return editor;
    }
    listEditors() {
        return Array.from(this._editors.values());
    }
    addEditors(editors) {
        const beforeSize = this._editors.size;
        editors.forEach((editor) => {
            if (!this._editors.has(editor)) {
                this._editors.add(editor);
                this.editorFeatureRegistry.runContributions(editor);
                editor.monacoEditor.onDidFocusEditorWidget(() => {
                    this._currentEditor = editor;
                });
                editor.monacoEditor.onContextMenu(() => {
                    this._currentEditor = editor;
                });
            }
        });
        if (this._editors.size !== beforeSize) {
            // fire event;
        }
    }
    removeEditors(editors) {
        const beforeSize = this._editors.size;
        editors.forEach((editor) => {
            this._editors.delete(editor);
            if (this._currentEditor === editor) {
                this._currentEditor = undefined;
            }
        });
        if (this._editors.size !== beforeSize) {
            // fire event;
        }
    }
    createDiffEditor(dom, options, overrides) {
        const preferenceOptions = (0, converter_1.getConvertedMonacoOptions)(this.configurationService);
        const mergedOptions = Object.assign(Object.assign(Object.assign({}, preferenceOptions.editorOptions), preferenceOptions.diffOptions), options);
        const monacoDiffEditor = this.monacoService.createDiffEditor(dom, mergedOptions, overrides);
        const editor = this.injector.get(BrowserDiffEditor, [monacoDiffEditor, options]);
        this._onDiffEditorCreate.fire(editor);
        return editor;
    }
    createMergeEditor(dom, options, overrides) {
        const preferenceOptions = (0, converter_1.getConvertedMonacoOptions)(this.configurationService);
        const mergedOptions = Object.assign(Object.assign(Object.assign(Object.assign({}, preferenceOptions.editorOptions), preferenceOptions.diffOptions), options), { 
            // merge editor not support wordWrap
            wordWrap: 'off' });
        const editor = this.monacoService.createMergeEditor(dom, mergedOptions, overrides);
        return editor;
    }
    listDiffEditors() {
        return Array.from(this._diffEditors.values());
    }
    addDiffEditors(diffEditors) {
        const beforeSize = this._diffEditors.size;
        diffEditors.forEach((diffEditor) => {
            if (!this._diffEditors.has(diffEditor)) {
                this._diffEditors.add(diffEditor);
            }
        });
        if (this._diffEditors.size !== beforeSize) {
            // fire event _onDiffEditorAdd;
        }
    }
    removeDiffEditors(diffEditors) {
        const beforeSize = this._diffEditors.size;
        diffEditors.forEach((diffEditor) => {
            this._diffEditors.delete(diffEditor);
        });
        if (this._diffEditors.size !== beforeSize) {
            // fire event _onDiffEditorRemove;
        }
    }
    // 将docModel的变更事件反映至resource的dirty装饰
    onDocModelContentChangedEvent(e) {
        this.eventBus.fire(new common_1.ResourceDecorationNeedChangeEvent({
            uri: e.payload.uri,
            decoration: {
                dirty: !!e.payload.dirty,
                readOnly: !!e.payload.readonly,
            },
        }));
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(),
    tslib_1.__metadata("design:type", monaco_1.MonacoService)
], EditorCollectionServiceImpl.prototype, "monacoService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(di_1.INJECTOR_TOKEN),
    tslib_1.__metadata("design:type", di_1.Injector)
], EditorCollectionServiceImpl.prototype, "injector", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(configuration_1.IConfigurationService),
    tslib_1.__metadata("design:type", Object)
], EditorCollectionServiceImpl.prototype, "configurationService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(types_2.IEditorFeatureRegistry),
    tslib_1.__metadata("design:type", feature_1.EditorFeatureRegistryImpl)
], EditorCollectionServiceImpl.prototype, "editorFeatureRegistry", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(types_1.IEditorDocumentModelService),
    tslib_1.__metadata("design:type", Object)
], EditorCollectionServiceImpl.prototype, "documentModelService", void 0);
tslib_1.__decorate([
    (0, ide_core_common_1.OnEvent)(types_1.EditorDocumentModelContentChangedEvent),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [types_1.EditorDocumentModelContentChangedEvent]),
    tslib_1.__metadata("design:returntype", void 0)
], EditorCollectionServiceImpl.prototype, "onDocModelContentChangedEvent", null);
EditorCollectionServiceImpl = tslib_1.__decorate([
    (0, di_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [])
], EditorCollectionServiceImpl);
exports.EditorCollectionServiceImpl = EditorCollectionServiceImpl;
function insertSnippetWithMonacoEditor(editor, template, ranges, opts) {
    const snippetController = editor.getContribution('snippetController2');
    const selections = ranges.map((r) => new monaco.Selection(r.startLineNumber, r.startColumn, r.endLineNumber, r.endColumn));
    editor.setSelections(selections);
    editor.focus();
    snippetController.insert(template, 0, 0, opts.undoStopBefore, opts.undoStopAfter);
}
exports.insertSnippetWithMonacoEditor = insertSnippetWithMonacoEditor;
function updateOptionsWithMonacoEditor(monacoEditor, editorOptions, modelOptions) {
    monacoEditor.updateOptions(editorOptions);
    if (monacoEditor.getModel()) {
        monacoEditor.getModel().updateOptions(modelOptions);
    }
}
let BaseMonacoEditorWrapper = class BaseMonacoEditorWrapper extends ide_core_common_1.WithEventBus {
    get currentUri() {
        return this.currentDocumentModel ? this.currentDocumentModel.uri : null;
    }
    getId() {
        return this.monacoEditor.getId();
    }
    getSelections() {
        return this.monacoEditor.getSelections() || [];
    }
    disableSelectionEmitter() {
        this._disableSelectionEmitter = true;
    }
    enableSelectionEmitter() {
        this._disableSelectionEmitter = false;
    }
    constructor(monacoEditor, type) {
        super();
        this.monacoEditor = monacoEditor;
        this.type = type;
        this.onFocus = this.monacoEditor.onDidFocusEditorWidget;
        this.onBlur = this.monacoEditor.onDidBlurEditorWidget;
        this._specialEditorOptions = {};
        this._specialModelOptions = {};
        this._editorOptionsFromContribution = {};
        this._disableSelectionEmitter = false;
        this.decorationApplier = this.injector.get(decoration_applier_1.MonacoEditorDecorationApplier, [this.monacoEditor]);
        this.addDispose(this.monacoEditor.onDidChangeModel(this.onDidChangeModel.bind(this)));
        this.addDispose(this.monacoEditor.onDidChangeModelLanguage(() => {
            this._doUpdateOptions();
        }));
        this.addDispose(this.configurationService.onDidChangeConfiguration((e) => {
            const changedEditorKeys = e.affectedKeys.filter((key) => (0, converter_1.isEditorOption)(key));
            if (changedEditorKeys.length > 0) {
                this._doUpdateOptions();
            }
        }));
    }
    async onDidChangeModel() {
        this._editorOptionsFromContribution = {};
        const uri = this.currentUri;
        if (uri) {
            Promise.resolve(this.editorFeatureRegistry.runProvideEditorOptionsForUri(uri)).then((options) => {
                if (!this.currentUri || !uri.isEqual(this.currentUri)) {
                    return; // uri可能已经变了
                }
                if (options && Object.keys(options).length > 0) {
                    this._editorOptionsFromContribution = options;
                    if (!(0, ide_core_common_1.isEmptyObject)(this._editorOptionsFromContribution)) {
                        this._doUpdateOptions();
                    }
                }
            });
        }
    }
    getType() {
        return this.type;
    }
    updateOptions(editorOptions = {}, modelOptions = {}) {
        this._specialEditorOptions = removeUndefined(Object.assign(Object.assign({}, this._specialEditorOptions), editorOptions));
        this._specialModelOptions = removeUndefined(Object.assign(Object.assign({}, this._specialModelOptions), modelOptions));
        this._doUpdateOptions();
    }
    _doUpdateOptions() {
        const { editorOptions, modelOptions } = this._calculateFinalOptions();
        updateOptionsWithMonacoEditor(this.monacoEditor, editorOptions, modelOptions);
    }
    /**
     * 合并所有的选项
     * 优先关系: （从高到底）
     * 1. 当前编辑器的特殊选项（通过调用 updateOptions或者启动时传入）
     * 2. 来自 featureRegistry 的根据 当前uri 提供的选项
     * 3. 来自偏好设置的选项
     */
    _calculateFinalOptions() {
        var _a;
        const uriStr = this.currentUri ? this.currentUri.toString() : undefined;
        const languageId = this.currentDocumentModel ? this.currentDocumentModel.languageId : undefined;
        const options = (0, converter_1.getConvertedMonacoOptions)(this.configurationService, uriStr, languageId, undefined);
        const basicEditorOptions = {
            readOnly: ((_a = this.currentDocumentModel) === null || _a === void 0 ? void 0 : _a.readonly) || false,
        };
        let editorOptions = Object.assign(Object.assign(Object.assign(Object.assign({}, basicEditorOptions), options.editorOptions), this._editorOptionsFromContribution), this._specialEditorOptions);
        if (this.type !== common_1.EditorType.CODE) {
            editorOptions = Object.assign(Object.assign({}, editorOptions), options.diffOptions);
        }
        return {
            editorOptions,
            modelOptions: Object.assign(Object.assign({}, options.modelOptions), this._specialModelOptions),
        };
    }
    insertSnippet(template, ranges, opts) {
        insertSnippetWithMonacoEditor(this.monacoEditor, template, ranges, opts);
    }
    applyDecoration(key, options) {
        this.decorationApplier.applyDecoration(key, options);
    }
    onSelectionsChanged(listener) {
        return this.monacoEditor.onDidChangeCursorSelection((e) => {
            if (!this._disableSelectionEmitter) {
                listener({
                    selections: this.getSelections(),
                    source: e.source,
                });
            }
        });
    }
    onVisibleRangesChanged(listener) {
        const disposer = new ide_core_common_1.Disposable();
        const monacoEditor = this.monacoEditor;
        disposer.addDispose(monacoEditor.onDidScrollChange((e) => {
            listener(this.monacoEditor.getVisibleRanges());
        }));
        disposer.addDispose(monacoEditor.onDidLayoutChange((e) => {
            listener(this.monacoEditor.getVisibleRanges());
        }));
        return disposer;
    }
    setSelections(selections) {
        return this.monacoEditor.setSelections(selections);
    }
    setSelection(selection) {
        return this.monacoEditor.setSelection(selection);
    }
    async save() {
        if (this.currentDocumentModel) {
            await this.currentDocumentModel.save();
        }
    }
    onConfigurationChanged(listener) {
        const monacoEditor = this.monacoEditor;
        return monacoEditor.onDidChangeConfiguration((e) => {
            listener();
        });
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(types_2.IEditorFeatureRegistry),
    tslib_1.__metadata("design:type", Object)
], BaseMonacoEditorWrapper.prototype, "editorFeatureRegistry", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(configuration_1.IConfigurationService),
    tslib_1.__metadata("design:type", Object)
], BaseMonacoEditorWrapper.prototype, "configurationService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(di_1.INJECTOR_TOKEN),
    tslib_1.__metadata("design:type", di_1.Injector)
], BaseMonacoEditorWrapper.prototype, "injector", void 0);
BaseMonacoEditorWrapper = tslib_1.__decorate([
    (0, di_1.Injectable)({ multiple: true }),
    tslib_1.__metadata("design:paramtypes", [Object, Object])
], BaseMonacoEditorWrapper);
exports.BaseMonacoEditorWrapper = BaseMonacoEditorWrapper;
class BrowserCodeEditor extends BaseMonacoEditorWrapper {
    get currentDocumentModel() {
        if (this._currentDocumentModelRef && !this._currentDocumentModelRef.disposed) {
            return this._currentDocumentModelRef.instance;
        }
        else {
            return null;
        }
    }
    getType() {
        return common_1.EditorType.CODE;
    }
    constructor(monacoEditor, options = {}) {
        super(monacoEditor, common_1.EditorType.CODE);
        this.monacoEditor = monacoEditor;
        this.editorState = new Map();
        this.toDispose = [];
        this._onCursorPositionChanged = new ide_core_common_1.Emitter();
        this.onCursorPositionChanged = this._onCursorPositionChanged.event;
        this._disposed = false;
        this._onRefOpen = new ide_core_common_2.Emitter();
        this.onRefOpen = this._onRefOpen.event;
        this._specialEditorOptions = options;
        this.collectionService.addEditors([this]);
        // 防止浏览器后退前进手势
        const disposer = monacoEditor.onDidChangeModel(() => {
            bindPreventNavigation(this.monacoEditor.getDomNode());
            disposer.dispose();
        });
        this.toDispose.push(monacoEditor.onDidChangeCursorPosition(() => {
            if (!this.currentDocumentModel) {
                return;
            }
            const selection = monacoEditor.getSelection();
            this._onCursorPositionChanged.fire({
                position: monacoEditor.getPosition(),
                selectionLength: selection ? this.currentDocumentModel.getMonacoModel().getValueInRange(selection).length : 0,
            });
        }));
        this.addDispose({
            dispose: () => {
                this.monacoEditor.dispose();
            },
        });
    }
    layout() {
        this.monacoEditor.layout();
    }
    focus() {
        this.monacoEditor.focus();
    }
    dispose() {
        super.dispose();
        this.saveCurrentState();
        this.collectionService.removeEditors([this]);
        this._disposed = true;
        this.toDispose.forEach((disposable) => disposable.dispose());
    }
    saveCurrentState() {
        if (this.currentUri) {
            const state = this.monacoEditor.saveViewState();
            if (state) {
                this.editorState.set(this.currentUri.toString(), state);
            }
        }
    }
    restoreState() {
        if (this.currentUri) {
            const state = this.editorState.get(this.currentUri.toString());
            if (state) {
                this.monacoEditor.restoreViewState(state);
            }
        }
    }
    open(documentModelRef) {
        this.saveCurrentState();
        this._currentDocumentModelRef = documentModelRef;
        const model = this.currentDocumentModel.getMonacoModel();
        this.disableSelectionEmitter();
        this.monacoEditor.setModel(model);
        this.enableSelectionEmitter();
        this.restoreState();
        this._onRefOpen.fire(documentModelRef);
        // monaco 在文件首次打开时不会触发 cursorChange
        this._onCursorPositionChanged.fire({
            position: this.monacoEditor.getPosition(),
            selectionLength: 0,
        });
        const { instance } = documentModelRef;
        /**
         * 这里需要触发一下 monaco 的更新
         */
        this.updateOptions();
        this.eventBus.fire(new common_1.ResourceDecorationNeedChangeEvent({
            uri: instance.uri,
            decoration: {
                readOnly: instance.readonly,
            },
        }));
    }
}
tslib_1.__decorate([
    (0, di_1.Autowired)(common_1.EditorCollectionService),
    tslib_1.__metadata("design:type", EditorCollectionServiceImpl)
], BrowserCodeEditor.prototype, "collectionService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(types_2.IEditorFeatureRegistry),
    tslib_1.__metadata("design:type", Object)
], BrowserCodeEditor.prototype, "editorFeatureRegistry", void 0);
exports.BrowserCodeEditor = BrowserCodeEditor;
class BrowserDiffEditor extends ide_core_common_1.WithEventBus {
    get originalDocModel() {
        if (this.originalDocModelRef && !this.originalDocModelRef.disposed) {
            return this.originalDocModelRef.instance;
        }
        return null;
    }
    get modifiedDocModel() {
        if (this.modifiedDocModelRef && !this.modifiedDocModelRef.disposed) {
            return this.modifiedDocModelRef.instance;
        }
        return null;
    }
    saveCurrentState() {
        if (this.currentUri) {
            const state = this.monacoDiffEditor.saveViewState();
            if (state) {
                this.editorState.set(this.currentUri.toString(), state);
            }
        }
    }
    restoreState() {
        if (this.currentUri) {
            const state = this.editorState.get(this.currentUri.toString());
            if (state) {
                this.monacoDiffEditor.restoreViewState(state);
            }
        }
    }
    constructor(monacoDiffEditor, specialOptions = {}) {
        super();
        this.monacoDiffEditor = monacoDiffEditor;
        this.specialOptions = specialOptions;
        this.editorState = new Map();
        this.wrapEditors();
        this.addDispose(this.configurationService.onDidChangeConfiguration((e) => {
            const changedEditorKeys = e.affectedKeys.filter((key) => (0, converter_1.isDiffEditorOption)(key));
            if (changedEditorKeys.length > 0) {
                this.doUpdateDiffOptions();
            }
        }));
    }
    async compare(originalDocModelRef, modifiedDocModelRef, options = {}, rawUri) {
        this.saveCurrentState(); // 保存上一个状态
        this.originalDocModelRef = originalDocModelRef;
        this.modifiedDocModelRef = modifiedDocModelRef;
        if (!this.originalDocModel || !this.modifiedDocModel) {
            return;
        }
        const original = this.originalDocModel.getMonacoModel();
        const modified = this.modifiedDocModel.getMonacoModel();
        this.monacoDiffEditor.setModel({
            original,
            modified,
        });
        if (rawUri) {
            this.currentUri = rawUri;
        }
        else {
            this.currentUri = ide_core_common_1.URI.from({
                scheme: 'diff',
                query: ide_core_common_1.URI.stringifyQuery({
                    name,
                    original: this.originalDocModel.uri.toString(),
                    modified: this.modifiedDocModel.uri.toString(),
                }),
            });
        }
        if (options.range || options.originalRange) {
            const range = (options.range || options.originalRange);
            const currentEditor = options.range ? this.modifiedEditor.monacoEditor : this.originalEditor.monacoEditor;
            // 必须使用 setTimeout, 因为两边的 editor 出现时机问题，diffEditor是异步显示和渲染
            setTimeout(() => {
                currentEditor.revealRangeInCenter(range);
                currentEditor.setSelection(range);
            });
            // monaco diffEditor 在setModel后，计算diff完成后, 左侧 originalEditor 会发出一个异步的onScroll，
            // 这个行为可能会带动右侧 modifiedEditor 进行滚动， 导致 revealRange 错位
            // 此处 添加一个onDidUpdateDiff 监听
            const disposer = this.monacoDiffEditor.onDidUpdateDiff(() => {
                disposer.dispose();
                currentEditor.setSelection(range);
                setTimeout(() => {
                    currentEditor.revealRangeInCenter(range);
                });
            });
        }
        else {
            this.restoreState();
        }
        if (options.revealFirstDiff) {
            const diffs = this.monacoDiffEditor.getLineChanges();
            if (diffs && diffs.length > 0) {
                this.showFirstDiff();
            }
            else {
                const disposer = this.monacoDiffEditor.onDidUpdateDiff(() => {
                    this.showFirstDiff();
                    disposer.dispose();
                });
            }
        }
        await this.updateOptionsOnModelChange();
        this.diffResourceKeys.forEach((r) => r.set(this.currentUri));
    }
    showFirstDiff() {
        const diffs = this.monacoDiffEditor.getLineChanges();
        if (diffs && diffs.length > 0) {
            setTimeout(() => {
                this.monacoDiffEditor.revealLineInCenter(diffs[0].modifiedStartLineNumber);
            }, 0);
        }
    }
    async updateOptionsOnModelChange() {
        await this.doUpdateDiffOptions();
    }
    isReadonly() {
        var _a;
        return !!((_a = this.modifiedDocModel) === null || _a === void 0 ? void 0 : _a.readonly);
    }
    async doUpdateDiffOptions() {
        const uriStr = this.modifiedEditor.currentUri ? this.modifiedEditor.currentUri.toString() : undefined;
        const languageId = this.modifiedEditor.currentDocumentModel
            ? this.modifiedEditor.currentDocumentModel.languageId
            : undefined;
        const options = (0, converter_1.getConvertedMonacoOptions)(this.configurationService, uriStr, languageId);
        const readOnly = this.isReadonly();
        this.monacoDiffEditor.updateOptions(Object.assign(Object.assign(Object.assign({}, options.diffOptions), this.specialOptions), { readOnly, renderMarginRevertIcon: !readOnly }));
        if (this.currentUri) {
            this.eventBus.fire(new common_1.ResourceDecorationNeedChangeEvent({
                uri: this.currentUri,
                decoration: {
                    readOnly: this.isReadonly(),
                },
            }));
        }
    }
    updateDiffOptions(options) {
        this.specialOptions = removeUndefined(Object.assign(Object.assign({}, this.specialOptions), options));
        this.doUpdateDiffOptions();
    }
    getLineChanges() {
        const diffChanges = this.monacoDiffEditor.getLineChanges();
        if (!diffChanges) {
            return null;
        }
        return diffChanges.map((change) => {
            var _a;
            return [
                change.originalStartLineNumber,
                change.originalEndLineNumber,
                change.modifiedStartLineNumber,
                change.modifiedEndLineNumber,
                (_a = change.charChanges) === null || _a === void 0 ? void 0 : _a.map((charChange) => [
                    charChange.originalStartLineNumber,
                    charChange.originalStartColumn,
                    charChange.originalEndLineNumber,
                    charChange.originalEndColumn,
                    charChange.modifiedStartLineNumber,
                    charChange.modifiedStartColumn,
                    charChange.modifiedEndLineNumber,
                    charChange.modifiedEndColumn,
                ]),
            ];
        });
    }
    wrapEditors() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const diffEditor = this;
        this.originalEditor = this.injector.get(DiffEditorPart, [
            diffEditor.monacoDiffEditor.getOriginalEditor(),
            () => diffEditor.originalDocModel,
            common_1.EditorType.ORIGINAL_DIFF,
        ]);
        this.modifiedEditor = this.injector.get(DiffEditorPart, [
            diffEditor.monacoDiffEditor.getModifiedEditor(),
            () => diffEditor.modifiedDocModel,
            common_1.EditorType.MODIFIED_DIFF,
        ]);
        this.collectionService.addEditors([this.originalEditor, this.modifiedEditor]);
        this.collectionService.addDiffEditors([this]);
        // 为 modified 和 original editor 的 contextKeyService 注入diffEditor的ResourceKey
        const modifiedContextKeyService = this.contextKeyService.createScoped(this.modifiedEditor.monacoEditor._contextKeyService);
        const originalContextKeyService = this.contextKeyService.createScoped(this.originalEditor.monacoEditor._contextKeyService);
        this.diffResourceKeys = [
            new contextkey_1.ResourceContextKey(modifiedContextKeyService, undefined, 'diffResource'),
            new contextkey_1.ResourceContextKey(originalContextKeyService, undefined, 'diffResource'),
        ];
    }
    layout() {
        return this.monacoDiffEditor.layout();
    }
    focus() {
        this.monacoDiffEditor.focus();
    }
    dispose() {
        super.dispose();
        this.collectionService.removeEditors([this.originalEditor, this.modifiedEditor]);
        this.collectionService.removeDiffEditors([this]);
        this.monacoDiffEditor.dispose();
        this._disposed = true;
    }
}
tslib_1.__decorate([
    (0, di_1.Autowired)(common_1.EditorCollectionService),
    tslib_1.__metadata("design:type", EditorCollectionServiceImpl)
], BrowserDiffEditor.prototype, "collectionService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(di_1.INJECTOR_TOKEN),
    tslib_1.__metadata("design:type", di_1.Injector)
], BrowserDiffEditor.prototype, "injector", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(configuration_1.IConfigurationService),
    tslib_1.__metadata("design:type", Object)
], BrowserDiffEditor.prototype, "configurationService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.IContextKeyService),
    tslib_1.__metadata("design:type", Object)
], BrowserDiffEditor.prototype, "contextKeyService", void 0);
exports.BrowserDiffEditor = BrowserDiffEditor;
// utils
function bindPreventNavigation(div) {
    div.addEventListener('mousewheel', preventNavigation);
}
function preventNavigation(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.offsetWidth + this.scrollLeft + e.deltaX > this.scrollWidth) {
        e.preventDefault();
        e.stopPropagation();
    }
    else if (this.scrollLeft + e.deltaX < 0) {
        e.preventDefault();
        e.stopPropagation();
    }
}
let DiffEditorPart = class DiffEditorPart extends BaseMonacoEditorWrapper {
    get currentDocumentModel() {
        return this.getDocumentModel();
    }
    constructor(monacoEditor, getDocumentModel, type) {
        super(monacoEditor, type);
        this.getDocumentModel = getDocumentModel;
    }
};
DiffEditorPart = tslib_1.__decorate([
    (0, di_1.Injectable)({ multiple: true }),
    tslib_1.__metadata("design:paramtypes", [Object, Function, Object])
], DiffEditorPart);
//# sourceMappingURL=editor-collection.service.js.map