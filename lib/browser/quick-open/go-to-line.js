"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoToLineQuickOpenHandler = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const quick_open_1 = require("@opensumi/ide-core-browser/lib/quick-open");
const gotoLineQuickAccess_1 = require("@opensumi/monaco-editor-core/esm/vs/editor/contrib/quickAccess/browser/gotoLineQuickAccess");
const monaco = tslib_1.__importStar(require("@opensumi/monaco-editor-core/esm/vs/editor/editor.api"));
const types_1 = require("../types");
class MonacoGoToLine extends gotoLineQuickAccess_1.AbstractGotoLineQuickAccessProvider {
    clearDecorations(editor) {
        super.clearDecorations(editor);
    }
    preview(editor, range) {
        editor.revealRangeInCenter(range, monaco.editor.ScrollType.Smooth);
        this.addDecorations(editor, range);
    }
    goTo(editor, range, preserveFocus = true) {
        this.gotoLocation({ editor }, {
            range,
            preserveFocus,
            // 该函数内部实现并没有用到这个属性
            keyMods: {
                alt: false,
                ctrlCmd: false,
            },
        });
    }
}
let GoToLineQuickOpenHandler = class GoToLineQuickOpenHandler {
    constructor() {
        this.prefix = ':';
        this.description = (0, ide_core_browser_1.localize)('quickopen.goToLine.desc');
        this.quickAccess = new MonacoGoToLine();
    }
    getFirstSelection() {
        const editor = this.workbenchEditorService.currentEditor;
        const selections = editor === null || editor === void 0 ? void 0 : editor.getSelections();
        return selections === null || selections === void 0 ? void 0 : selections[0];
    }
    getRange(line = 1, col = 1) {
        return {
            startLineNumber: line,
            endLineNumber: line,
            startColumn: col,
            endColumn: col,
        };
    }
    init() {
        var _a;
        // 保存打开时的状态
        this.savedViewState = (0, ide_core_browser_1.withNullAsUndefined)((_a = this.workbenchEditorService.currentEditor) === null || _a === void 0 ? void 0 : _a.monacoEditor.saveViewState());
    }
    getModel() {
        var _a, _b, _c, _d, _e;
        const editor = this.workbenchEditorService.currentEditor;
        const firstSelection = this.getFirstSelection();
        if (!firstSelection || !editor) {
            return {
                onType: (lookFor, acceptor) => {
                    acceptor([
                        new quick_open_1.QuickOpenItem({
                            label: (0, ide_core_browser_1.localize)('quickopen.goToLine.notValid'),
                            run: () => false,
                        }),
                    ]);
                },
            };
        }
        const currentLine = (_a = firstSelection.positionLineNumber) !== null && _a !== void 0 ? _a : 1;
        const currentCol = (_b = firstSelection.positionColumn) !== null && _b !== void 0 ? _b : 1;
        const lineCount = (_e = (_d = (_c = editor.currentDocumentModel) === null || _c === void 0 ? void 0 : _c.getMonacoModel()) === null || _d === void 0 ? void 0 : _d.getLineCount()) !== null && _e !== void 0 ? _e : 1;
        return {
            onType: (lookFor, acceptor) => {
                // https://github.com/microsoft/vscode/blob/1498d0f34053f854e75e1364adaca6f99e43de08/src/vs/editor/contrib/quickAccess/browser/gotoLineQuickAccess.ts#L114
                // Support different line-col formats
                const numbers = lookFor
                    .split(/,|:|#|：|，/)
                    .map((part) => parseInt(part, 10))
                    .filter((part) => !isNaN(part));
                const line = numbers[0];
                const col = numbers[1];
                if (line) {
                    let label = (0, ide_core_browser_1.formatLocalize)('quickopen.goToLine.lineInfo', line);
                    if (col) {
                        label += (0, ide_core_browser_1.formatLocalize)('quickopen.goToLine.colInfo', col);
                    }
                    const range = this.getRange(line, col);
                    acceptor([
                        new quick_open_1.QuickOpenItem({
                            label,
                            run: (mode) => {
                                if (mode === quick_open_1.Mode.PREVIEW) {
                                    this.quickAccess.preview(editor.monacoEditor, range);
                                    return false;
                                }
                                this.quickAccess.goTo(editor.monacoEditor, range, true);
                                return true;
                            },
                        }),
                    ]);
                }
                else {
                    this.quickAccess.clearDecorations(editor.monacoEditor);
                    acceptor([
                        new quick_open_1.QuickOpenItem({
                            label: (0, ide_core_browser_1.formatLocalize)('quickopen.goToLine.defaultMessage', currentLine, currentCol, lineCount),
                            run: () => false,
                        }),
                    ]);
                }
            },
        };
    }
    getOptions() {
        return {};
    }
    onClose(canceled) {
        const editor = this.workbenchEditorService.currentEditor;
        if (!editor) {
            return;
        }
        editor.monacoEditor.focus();
        this.quickAccess.clearDecorations(editor.monacoEditor);
        if (canceled && this.savedViewState) {
            editor.monacoEditor.restoreViewState(this.savedViewState);
        }
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(quick_open_1.PrefixQuickOpenService),
    tslib_1.__metadata("design:type", Object)
], GoToLineQuickOpenHandler.prototype, "quickOpenService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.CommandService),
    tslib_1.__metadata("design:type", Object)
], GoToLineQuickOpenHandler.prototype, "commandService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(types_1.WorkbenchEditorService),
    tslib_1.__metadata("design:type", types_1.WorkbenchEditorService)
], GoToLineQuickOpenHandler.prototype, "workbenchEditorService", void 0);
GoToLineQuickOpenHandler = tslib_1.__decorate([
    (0, di_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [])
], GoToLineQuickOpenHandler);
exports.GoToLineQuickOpenHandler = GoToLineQuickOpenHandler;
//# sourceMappingURL=go-to-line.js.map