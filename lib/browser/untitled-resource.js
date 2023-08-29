"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UntitledSchemeResourceProvider = exports.UntitledSchemeDocumentProvider = exports.UntitledDocumentIdCounter = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const ide_overlay_1 = require("@opensumi/ide-overlay");
const common_1 = require("../common");
const types_1 = require("./doc-model/types");
let UntitledDocumentIdCounter = class UntitledDocumentIdCounter {
    constructor() {
        this._id = 1;
    }
    get id() {
        return this._id++;
    }
};
UntitledDocumentIdCounter = tslib_1.__decorate([
    (0, di_1.Injectable)()
], UntitledDocumentIdCounter);
exports.UntitledDocumentIdCounter = UntitledDocumentIdCounter;
let UntitledSchemeDocumentProvider = class UntitledSchemeDocumentProvider {
    constructor() {
        this._onDidChangeContent = new ide_core_browser_1.Emitter();
        this.onDidChangeContent = this._onDidChangeContent.event;
    }
    handlesScheme(scheme) {
        return scheme === ide_core_browser_1.Schemes.untitled;
    }
    async provideEncoding(uri) {
        const encoding = this.preferenceService.get('files.encoding', undefined, uri.toString(), (0, ide_core_browser_1.getLanguageIdFromMonaco)(uri));
        return encoding || 'utf8';
    }
    async provideEOL(uri) {
        const backendOS = await this.applicationService.getBackendOS();
        const eol = this.preferenceService.get('files.eol', 'auto', uri.toString(), (0, ide_core_browser_1.getLanguageIdFromMonaco)(uri));
        if (eol !== 'auto') {
            return eol;
        }
        return backendOS === ide_core_browser_1.OperatingSystem.Windows ? "\r\n" /* EOL.CRLF */ : "\n" /* EOL.LF */;
    }
    async provideEditorDocumentModelContent(uri, encoding) {
        return '';
    }
    isReadonly(uri) {
        return false;
    }
    isAlwaysDirty(uri) {
        // untitled 文件允许新建后就可以保存
        return true;
    }
    disposeEvenDirty(uri) {
        // untitled 即便是 dirty 状态下，在关闭后也要被 dispose
        return true;
    }
    closeAutoSave(uri) {
        return true;
    }
    async saveDocumentModel(uri, content, baseContent, changes, encoding, ignoreDiff = false) {
        const { name } = uri.getParsedQuery();
        const defaultPath = uri.path.toString() !== '/' ? ide_core_browser_1.path.dirname(uri.path.toString()) : this.appConfig.workspaceDir;
        const saveUri = await this.commandService.tryExecuteCommand('file.save', {
            showNameInput: true,
            defaultFileName: name || uri.displayName,
            defaultUri: ide_core_browser_1.URI.file(ide_core_browser_1.isWindows ? defaultPath.replaceAll('\\', '/') : defaultPath),
        });
        if (saveUri) {
            await this.editorDocumentModelService.saveEditorDocumentModel(saveUri, content, baseContent, changes, encoding, ignoreDiff);
            // TODO: 不依赖 workspaceEditor，先关闭再打开，等 fileSystemProvider 迁移到前端再做改造
            await this.workbenchEditorService.open(saveUri, {
                preview: false,
                focus: true,
                replace: true,
                forceClose: true,
            });
        }
        return {
            state: ide_core_browser_1.SaveTaskResponseState.SUCCESS,
        };
    }
    onDidDisposeModel() { }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(types_1.IEditorDocumentModelService),
    tslib_1.__metadata("design:type", Object)
], UntitledSchemeDocumentProvider.prototype, "editorDocumentModelService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(common_1.WorkbenchEditorService),
    tslib_1.__metadata("design:type", common_1.WorkbenchEditorService)
], UntitledSchemeDocumentProvider.prototype, "workbenchEditorService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.CommandService),
    tslib_1.__metadata("design:type", Object)
], UntitledSchemeDocumentProvider.prototype, "commandService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.AppConfig),
    tslib_1.__metadata("design:type", Object)
], UntitledSchemeDocumentProvider.prototype, "appConfig", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.IApplicationService),
    tslib_1.__metadata("design:type", Object)
], UntitledSchemeDocumentProvider.prototype, "applicationService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.PreferenceService),
    tslib_1.__metadata("design:type", Object)
], UntitledSchemeDocumentProvider.prototype, "preferenceService", void 0);
UntitledSchemeDocumentProvider = tslib_1.__decorate([
    (0, di_1.Injectable)()
], UntitledSchemeDocumentProvider);
exports.UntitledSchemeDocumentProvider = UntitledSchemeDocumentProvider;
let UntitledSchemeResourceProvider = class UntitledSchemeResourceProvider extends ide_core_browser_1.WithEventBus {
    constructor() {
        super(...arguments);
        this.scheme = ide_core_browser_1.Schemes.untitled;
    }
    provideResource(uri) {
        const { name } = uri.getParsedQuery();
        return {
            name: name || uri.displayName,
            uri,
            icon: '',
            metadata: null,
        };
    }
    async shouldCloseResourceWithoutConfirm(resource) {
        const documentModelRef = this.documentModelService.getModelReference(resource.uri, 'close-resource-check');
        if (documentModelRef && documentModelRef.instance.dirty) {
            return true;
        }
        return false;
    }
    async close(resource, saveAction) {
        const documentModelRef = this.documentModelService.getModelReference(resource.uri, 'close-resource-check');
        if (!documentModelRef) {
            return false;
        }
        if (saveAction === common_1.AskSaveResult.SAVE) {
            const res = await documentModelRef.instance.save();
            documentModelRef.dispose();
            return res;
        }
        else if (saveAction === common_1.AskSaveResult.REVERT) {
            await documentModelRef.instance.revert();
            documentModelRef.dispose();
            return true;
        }
        else if (!saveAction || saveAction === common_1.AskSaveResult.CANCEL) {
            documentModelRef.dispose();
            return false;
        }
        else {
            return true;
        }
    }
    async shouldCloseResource(resource) {
        const documentModelRef = this.documentModelService.getModelReference(resource.uri, 'close-resource-check');
        if (!documentModelRef || !documentModelRef.instance.dirty) {
            if (documentModelRef) {
                documentModelRef.dispose();
            }
            return true;
        }
        // 询问用户是否保存
        const buttons = {
            [(0, ide_core_browser_1.localize)('file.prompt.dontSave', "Don't Save")]: common_1.AskSaveResult.REVERT,
            [(0, ide_core_browser_1.localize)('file.prompt.save', 'Save')]: common_1.AskSaveResult.SAVE,
            [(0, ide_core_browser_1.localize)('file.prompt.cancel', 'Cancel')]: common_1.AskSaveResult.CANCEL,
        };
        const selection = await this.dialogService.open((0, ide_core_browser_1.formatLocalize)('saveChangesMessage', resource.name), ide_core_browser_1.MessageType.Info, Object.keys(buttons));
        return await this.close(resource, buttons[selection]);
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_overlay_1.IDialogService),
    tslib_1.__metadata("design:type", Object)
], UntitledSchemeResourceProvider.prototype, "dialogService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(types_1.IEditorDocumentModelService),
    tslib_1.__metadata("design:type", Object)
], UntitledSchemeResourceProvider.prototype, "documentModelService", void 0);
UntitledSchemeResourceProvider = tslib_1.__decorate([
    (0, di_1.Injectable)()
], UntitledSchemeResourceProvider);
exports.UntitledSchemeResourceProvider = UntitledSchemeResourceProvider;
//# sourceMappingURL=untitled-resource.js.map