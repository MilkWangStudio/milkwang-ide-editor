"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorStatusBarService = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const services_1 = require("@opensumi/ide-core-browser/lib/services");
const common_1 = require("../common");
const types_1 = require("./doc-model/types");
let EditorStatusBarService = class EditorStatusBarService extends ide_core_browser_1.WithEventBus {
    setListener() {
        this.workbenchEditorService.onActiveResourceChange(() => {
            this.updateLanguageStatus(this.workbenchEditorService.currentEditor);
        });
        this.workbenchEditorService.onCursorChange((cursorStatus) => {
            this.updateCursorStatus(cursorStatus);
        });
        this.eventBus.on(types_1.EditorDocumentModelOptionChangedEvent, (e) => {
            const currentEditor = this.workbenchEditorService.currentEditor;
            if (currentEditor && currentEditor.currentUri && currentEditor.currentUri.isEqual(e.payload.uri)) {
                this.updateLanguageStatus(this.workbenchEditorService.currentEditor);
            }
        });
    }
    updateCursorStatus(cursorStatus) {
        const { position, selectionLength } = cursorStatus;
        if (!position) {
            this.statusBar.removeElement('editor-status-cursor');
            return;
        }
        const lineLabel = '%status-bar.label.line%';
        const colLabel = '%status-bar.label.column%';
        const selectedLabel = '%status-bar.label.selected%';
        this.statusBar.addElement('editor-status-cursor', {
            name: (0, ide_core_browser_1.localize)('status-bar.editor-selection'),
            text: `${lineLabel}${position.lineNumber}，${colLabel}${position.column}${selectionLength ? `（${selectedLabel}${selectionLength}）` : ''}`,
            priority: 4,
            alignment: services_1.StatusBarAlignment.RIGHT,
            command: ide_core_browser_1.EDITOR_COMMANDS.GO_TO_LINE.id,
            tooltip: (0, ide_core_browser_1.localize)('status.editor.goToLineCol'),
        });
    }
    updateLanguageStatus(editor) {
        if (!editor) {
            this.statusBar.removeElement('editor-status-language');
            this.statusBar.removeElement('editor-status-encoding');
            this.statusBar.removeElement('editor-status-eol');
            this.statusBar.removeElement('editor-status-space');
            return;
        }
        let languageId = '';
        let encoding = '';
        let eol = '';
        let insertSpaces = false;
        let tabSize = 2;
        const documentModel = editor.currentDocumentModel;
        if (documentModel) {
            languageId = documentModel.languageId;
            encoding = documentModel.encoding;
            eol = documentModel.eol;
            insertSpaces = documentModel.getMonacoModel().getOptions().insertSpaces;
            tabSize = documentModel.getMonacoModel().getOptions().tabSize;
        }
        const eolText = eol === '\n' ? 'LF' : 'CRLF';
        const language = this.languageService.getLanguage(languageId);
        const languageName = language ? language.name : '';
        this.statusBar.addElement('editor-status-language', {
            name: (0, ide_core_browser_1.localize)('status-bar.editor-language'),
            text: languageName,
            alignment: services_1.StatusBarAlignment.RIGHT,
            priority: 1,
            command: ide_core_browser_1.EDITOR_COMMANDS.CHANGE_LANGUAGE.id,
            tooltip: (0, ide_core_browser_1.localize)('status.editor.chooseLanguage'),
        });
        this.statusBar.addElement('editor-status-encoding', {
            name: (0, ide_core_browser_1.localize)('status-bar.editor-encoding'),
            text: encoding.toUpperCase(),
            alignment: services_1.StatusBarAlignment.RIGHT,
            priority: 2,
            command: ide_core_browser_1.EDITOR_COMMANDS.CHANGE_ENCODING.id,
            tooltip: (0, ide_core_browser_1.localize)('status.editor.chooseEncoding'),
        });
        this.statusBar.addElement('editor-status-eol', {
            name: (0, ide_core_browser_1.localize)('status-bar.editor-eol'),
            text: eolText,
            alignment: services_1.StatusBarAlignment.RIGHT,
            priority: 3,
            command: ide_core_browser_1.EDITOR_COMMANDS.CHANGE_EOL.id,
            tooltip: (0, ide_core_browser_1.localize)('status.editor.changeEol'),
        });
        this.statusBar.addElement('editor-status-space', {
            name: (0, ide_core_browser_1.localize)('status-bar.editor-space'),
            text: (insertSpaces ? (0, ide_core_browser_1.localize)('status-bar.label.tabType.space') : (0, ide_core_browser_1.localize)('status-bar.label.tabType.tab')) +
                ': ' +
                tabSize,
            alignment: services_1.StatusBarAlignment.RIGHT,
            priority: 4,
            command: undefined,
        });
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(services_1.IStatusBarService),
    tslib_1.__metadata("design:type", Object)
], EditorStatusBarService.prototype, "statusBar", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(),
    tslib_1.__metadata("design:type", common_1.WorkbenchEditorService)
], EditorStatusBarService.prototype, "workbenchEditorService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(common_1.ILanguageService),
    tslib_1.__metadata("design:type", Object)
], EditorStatusBarService.prototype, "languageService", void 0);
EditorStatusBarService = tslib_1.__decorate([
    (0, di_1.Injectable)()
], EditorStatusBarService);
exports.EditorStatusBarService = EditorStatusBarService;
//# sourceMappingURL=editor.status-bar.service.js.map