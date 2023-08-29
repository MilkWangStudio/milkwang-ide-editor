"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaveParticipantsContribution = exports.TrimFinalNewLinesParticipant = exports.CodeActionOnSaveParticipant = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const progress_1 = require("@opensumi/ide-core-browser/lib/progress");
const monaco_api_1 = require("@opensumi/ide-monaco/lib/browser/monaco-api");
const languages_1 = require("@opensumi/ide-monaco/lib/browser/monaco-api/languages");
const editOperation_1 = require("@opensumi/monaco-editor-core/esm/vs/editor/common/core/editOperation");
const range_1 = require("@opensumi/monaco-editor-core/esm/vs/editor/common/core/range");
const languages = tslib_1.__importStar(require("@opensumi/monaco-editor-core/esm/vs/editor/common/languages"));
const codeAction_1 = require("@opensumi/monaco-editor-core/esm/vs/editor/contrib/codeAction/browser/codeAction");
const types_1 = require("@opensumi/monaco-editor-core/esm/vs/editor/contrib/codeAction/browser/types");
const monaco = tslib_1.__importStar(require("@opensumi/monaco-editor-core/esm/vs/editor/editor.api"));
const editor_override_1 = require("../editor.override");
const types_2 = require("../types");
const types_3 = require("./types");
function findEditor(model, codeEditorService) {
    let candidate = null;
    if (model.isAttachedToEditor()) {
        for (const editor of codeEditorService.listCodeEditors()) {
            if (editor.hasModel() && editor.getModel() === model) {
                if (editor.hasTextFocus()) {
                    return editor; // favour focused editor if there are multiple
                }
                candidate = editor;
            }
        }
    }
    return candidate;
}
let CodeActionOnSaveParticipant = class CodeActionOnSaveParticipant extends ide_core_browser_1.WithEventBus {
    get bulkEditService() {
        return this.overrideServiceRegistry.getRegisteredService(ide_core_browser_1.ServiceNames.BULK_EDIT_SERVICE);
    }
    activate() {
        // noop
    }
    async onEditorDocumentModelWillSave(e) {
        // 自动保存不运行
        if (e.payload.reason !== types_2.SaveReason.Manual) {
            return;
        }
        const preferenceActions = this.preferenceService.get('editor.codeActionsOnSave', undefined, e.payload.uri.toString(), e.payload.language);
        if (!preferenceActions) {
            return undefined;
        }
        const preferenceSaveCodeActionsNotification = this.preferenceService.get('editor.codeActionsOnSaveNotification', true, e.payload.uri.toString(), e.payload.language);
        const runActions = (progress) => {
            const codeActions = Array.isArray(preferenceActions) ? preferenceActions : Object.keys(preferenceActions);
            const codeActionsOnSave = codeActions.map((p) => new types_1.CodeActionKind(p));
            if (!Array.isArray(preferenceActions)) {
                codeActionsOnSave.sort((a, b) => {
                    if (types_1.CodeActionKind.SourceFixAll.contains(a)) {
                        if (types_1.CodeActionKind.SourceFixAll.contains(b)) {
                            return 0;
                        }
                        return -1;
                    }
                    if (types_1.CodeActionKind.SourceFixAll.contains(b)) {
                        return 1;
                    }
                    return 0;
                });
            }
            if (codeActionsOnSave.length === 0) {
                return;
            }
            const modelRef = this.docService.getModelReference(e.payload.uri, 'codeActionOnSave');
            if (!modelRef) {
                return;
            }
            const model = modelRef.instance.getMonacoModel();
            const tokenSource = new monaco.CancellationTokenSource();
            const timeout = this.preferenceService.get('editor.codeActionsOnSaveTimeout', undefined, e.payload.uri.toString(), e.payload.language);
            const excludedActions = Array.isArray(preferenceActions)
                ? []
                : Object.keys(preferenceActions)
                    .filter((x) => preferenceActions[x] === false)
                    .map((x) => new types_1.CodeActionKind(x));
            return Promise.race([
                new Promise((_resolve, reject) => setTimeout(() => {
                    tokenSource.cancel();
                    reject('codeActionsOnSave timeout');
                }, timeout)),
                this.applyOnSaveActions(model, codeActionsOnSave, excludedActions, progress, tokenSource.token),
            ]).finally(() => {
                tokenSource.cancel();
                modelRef.dispose();
            });
        };
        if (preferenceSaveCodeActionsNotification) {
            return this.progressService.withProgress({
                title: (0, ide_core_browser_1.formatLocalize)('editor.saveCodeActions.saving', e.payload.uri.displayName),
                location: ide_core_browser_1.ProgressLocation.Notification,
                cancellable: true,
            }, async (progress) => runActions(progress));
        }
        else {
            return runActions(null);
        }
    }
    async applyOnSaveActions(model, actions, excludes, progress, token) {
        const getActionProgress = new (class {
            constructor() {
                this._names = new Set();
            }
            _report() {
                progress &&
                    progress.report({
                        message: (0, ide_core_browser_1.formatLocalize)('editor.saveCodeActions.getting', [...this._names].map((name) => `'${name}'`).join(', ')),
                    });
            }
            report(provider) {
                if (provider.displayName && !this._names.has(provider.displayName)) {
                    this._names.add(provider.displayName);
                    this._report();
                }
            }
        })();
        for (const codeActionKind of actions) {
            try {
                const actionsToRun = await this.getActionsToRun(model, codeActionKind, excludes, getActionProgress, token);
                await this.applyCodeActions(actionsToRun.validActions);
            }
            catch (e) {
                this.logger.error(e);
            }
        }
    }
    async applyCodeActions(actionsToRun) {
        var _a;
        for (const actionItem of actionsToRun) {
            if (actionItem.action.edit) {
                await ((_a = this.bulkEditService) === null || _a === void 0 ? void 0 : _a.apply(monaco_api_1.ResourceEdit.convert(actionItem.action.edit)));
            }
            if (actionItem.action.command) {
                await this.commandService.executeCommand(actionItem.action.command.id, ...(actionItem.action.command.arguments || []));
            }
        }
    }
    async getActionsToRun(model, codeActionKind, excludes, progress, token) {
        return (0, codeAction_1.getCodeActions)(languages_1.languageFeaturesService.codeActionProvider, model, model.getFullModelRange(), {
            type: languages.CodeActionTriggerType.Auto,
            filter: { include: codeActionKind, excludes, includeSourceActions: true },
            triggerAction: types_1.CodeActionTriggerSource.OnSave,
        }, progress, token);
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.PreferenceService),
    tslib_1.__metadata("design:type", Object)
], CodeActionOnSaveParticipant.prototype, "preferenceService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.MonacoOverrideServiceRegistry),
    tslib_1.__metadata("design:type", ide_core_browser_1.MonacoOverrideServiceRegistry)
], CodeActionOnSaveParticipant.prototype, "overrideServiceRegistry", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.CommandService),
    tslib_1.__metadata("design:type", Object)
], CodeActionOnSaveParticipant.prototype, "commandService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(types_3.IEditorDocumentModelService),
    tslib_1.__metadata("design:type", Object)
], CodeActionOnSaveParticipant.prototype, "docService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.ILogger),
    tslib_1.__metadata("design:type", Object)
], CodeActionOnSaveParticipant.prototype, "logger", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(progress_1.IProgressService),
    tslib_1.__metadata("design:type", Object)
], CodeActionOnSaveParticipant.prototype, "progressService", void 0);
tslib_1.__decorate([
    (0, ide_core_browser_1.OnEvent)(types_3.EditorDocumentModelWillSaveEvent),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [types_3.EditorDocumentModelWillSaveEvent]),
    tslib_1.__metadata("design:returntype", Promise)
], CodeActionOnSaveParticipant.prototype, "onEditorDocumentModelWillSave", null);
CodeActionOnSaveParticipant = tslib_1.__decorate([
    (0, di_1.Injectable)()
], CodeActionOnSaveParticipant);
exports.CodeActionOnSaveParticipant = CodeActionOnSaveParticipant;
let TrimFinalNewLinesParticipant = class TrimFinalNewLinesParticipant extends ide_core_browser_1.WithEventBus {
    activate() {
        // noop
    }
    async onEditorDocumentModelWillSave(e) {
        const isTrimFinalNewlines = this.preferenceService.get('files.trimFinalNewlines');
        if (isTrimFinalNewlines) {
            const modelRef = this.docService.getModelReference(e.payload.uri, 'trimFinalNewlines');
            if (!modelRef) {
                return;
            }
            const model = modelRef.instance.getMonacoModel();
            this.doTrimFinalNewLines(model, e.payload.reason !== types_2.SaveReason.Manual);
        }
    }
    /**
     * returns 0 if the entire file is empty
     */
    findLastNonEmptyLine(model) {
        for (let lineNumber = model.getLineCount(); lineNumber >= 1; lineNumber--) {
            const lineContent = model.getLineContent(lineNumber);
            if (lineContent.length > 0) {
                // this line has content
                return lineNumber;
            }
        }
        // no line has content
        return 0;
    }
    doTrimFinalNewLines(model, isAutoSaved) {
        const lineCount = model.getLineCount();
        // Do not insert new line if file does not end with new line
        if (lineCount === 1) {
            return;
        }
        let prevSelection = [];
        let cannotTouchLineNumber = 0;
        const codeEditorService = this.injector.get(editor_override_1.MonacoCodeService);
        const editor = findEditor(model, codeEditorService);
        if (editor) {
            prevSelection = editor.getSelections();
            if (isAutoSaved) {
                for (let i = 0, len = prevSelection.length; i < len; i++) {
                    const positionLineNumber = prevSelection[i].positionLineNumber;
                    if (positionLineNumber > cannotTouchLineNumber) {
                        cannotTouchLineNumber = positionLineNumber;
                    }
                }
            }
        }
        const lastNonEmptyLine = this.findLastNonEmptyLine(model);
        const deleteFromLineNumber = Math.max(lastNonEmptyLine + 1, cannotTouchLineNumber + 1);
        const deletionRange = model.validateRange(new range_1.Range(deleteFromLineNumber, 1, lineCount, model.getLineMaxColumn(lineCount)));
        if (deletionRange.isEmpty()) {
            return;
        }
        model.pushEditOperations(prevSelection, [editOperation_1.EditOperation.delete(deletionRange)], () => prevSelection);
        editor === null || editor === void 0 ? void 0 : editor.setSelections(prevSelection);
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.PreferenceService),
    tslib_1.__metadata("design:type", Object)
], TrimFinalNewLinesParticipant.prototype, "preferenceService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(types_3.IEditorDocumentModelService),
    tslib_1.__metadata("design:type", Object)
], TrimFinalNewLinesParticipant.prototype, "docService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.ILogger),
    tslib_1.__metadata("design:type", Object)
], TrimFinalNewLinesParticipant.prototype, "logger", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(di_1.INJECTOR_TOKEN),
    tslib_1.__metadata("design:type", di_1.Injector)
], TrimFinalNewLinesParticipant.prototype, "injector", void 0);
tslib_1.__decorate([
    (0, ide_core_browser_1.OnEvent)(types_3.EditorDocumentModelWillSaveEvent),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [types_3.EditorDocumentModelWillSaveEvent]),
    tslib_1.__metadata("design:returntype", Promise)
], TrimFinalNewLinesParticipant.prototype, "onEditorDocumentModelWillSave", null);
TrimFinalNewLinesParticipant = tslib_1.__decorate([
    (0, di_1.Injectable)()
], TrimFinalNewLinesParticipant);
exports.TrimFinalNewLinesParticipant = TrimFinalNewLinesParticipant;
let SaveParticipantsContribution = class SaveParticipantsContribution {
    onStart() {
        this.codeActionOnSaveParticipant.activate();
        this.trimFinalNewLinesParticipant.activate();
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(),
    tslib_1.__metadata("design:type", CodeActionOnSaveParticipant)
], SaveParticipantsContribution.prototype, "codeActionOnSaveParticipant", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(),
    tslib_1.__metadata("design:type", TrimFinalNewLinesParticipant)
], SaveParticipantsContribution.prototype, "trimFinalNewLinesParticipant", void 0);
SaveParticipantsContribution = tslib_1.__decorate([
    (0, ide_core_browser_1.Domain)(ide_core_browser_1.ClientAppContribution)
], SaveParticipantsContribution);
exports.SaveParticipantsContribution = SaveParticipantsContribution;
//# sourceMappingURL=saveParticipants.js.map