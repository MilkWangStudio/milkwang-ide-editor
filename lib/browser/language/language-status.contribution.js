"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageStatusContribution = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const common_1 = require("../../common");
const types_1 = require("../doc-model/types");
let LanguageStatusContribution = class LanguageStatusContribution extends ide_core_browser_1.WithEventBus {
    initialize() {
        this.workbenchEditorService.onActiveResourceChange(() => {
            this.updateLanguageStatus(this.workbenchEditorService.currentEditor);
        });
        this.eventBus.on(types_1.EditorDocumentModelOptionChangedEvent, (e) => {
            const currentEditor = this.workbenchEditorService.currentEditor;
            if (currentEditor && currentEditor.currentUri && currentEditor.currentUri.isEqual(e.payload.uri)) {
                this.updateLanguageStatus(this.workbenchEditorService.currentEditor);
            }
        });
    }
    updateLanguageStatus(editor) {
        if (!editor) {
            this.statusBar.removeElement('editor-status-language-status');
            return;
        }
        const documentModel = editor.currentDocumentModel;
        if (documentModel) {
            const all = this.languageStatusService.getLanguageStatus(documentModel.getMonacoModel());
            if (all.length) {
                this.statusBar.addElement('editor-status-language-status', {
                    name: (0, ide_core_browser_1.localize)('status-bar.editor-langStatus'),
                    alignment: ide_core_browser_1.StatusBarAlignment.RIGHT,
                    text: this.getLanguageStatusText(all),
                    // 默认在选择语言模式左边
                    priority: 1.1,
                    hoverContents: all.map((status) => ({
                        title: status.label,
                        name: status.name,
                        command: status.command,
                    })),
                    // 添加个空的执行函数以便点击状态栏有相应态
                    onClick: () => { },
                });
            }
        }
    }
    getLanguageStatusText(status) {
        if (status.length === 0) {
            return;
        }
        const [first] = status;
        switch (first.severity) {
            case ide_core_browser_1.Severity.Error:
                return '$(bracket-error)';
            case ide_core_browser_1.Severity.Warning:
                return '$(bracket-dot)';
            default:
                return '$(bracket)';
        }
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.IStatusBarService),
    tslib_1.__metadata("design:type", Object)
], LanguageStatusContribution.prototype, "statusBar", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(),
    tslib_1.__metadata("design:type", common_1.WorkbenchEditorService)
], LanguageStatusContribution.prototype, "workbenchEditorService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(common_1.ILanguageStatusService),
    tslib_1.__metadata("design:type", Object)
], LanguageStatusContribution.prototype, "languageStatusService", void 0);
LanguageStatusContribution = tslib_1.__decorate([
    (0, ide_core_browser_1.Domain)(ide_core_browser_1.ClientAppContribution)
], LanguageStatusContribution);
exports.LanguageStatusContribution = LanguageStatusContribution;
//# sourceMappingURL=language-status.contribution.js.map