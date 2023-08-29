"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonacoContextViewService = exports.MonacoCodeService = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const ide_core_common_1 = require("@opensumi/ide-core-common");
const abstractCodeEditorService_1 = require("@opensumi/monaco-editor-core/esm/vs/editor/browser/services/abstractCodeEditorService");
const monaco = tslib_1.__importStar(require("@opensumi/monaco-editor-core/esm/vs/editor/editor.api"));
const standaloneLayoutService_1 = require("@opensumi/monaco-editor-core/esm/vs/editor/standalone/browser/standaloneLayoutService");
const standaloneServices_1 = require("@opensumi/monaco-editor-core/esm/vs/editor/standalone/browser/standaloneServices");
const standaloneTheme_1 = require("@opensumi/monaco-editor-core/esm/vs/editor/standalone/common/standaloneTheme");
const contextViewService_1 = require("@opensumi/monaco-editor-core/esm/vs/platform/contextview/browser/contextViewService");
/* istanbul ignore file */
const common_1 = require("../common");
const workbench_editor_service_1 = require("./workbench-editor.service");
let MonacoCodeService = class MonacoCodeService extends abstractCodeEditorService_1.AbstractCodeEditorService {
    constructor() {
        super(standaloneServices_1.StandaloneServices.get(standaloneTheme_1.IStandaloneThemeService));
    }
    getActiveCodeEditor() {
        if (this.workbenchEditorService.currentEditor) {
            return this.workbenchEditorService.currentEditor.monacoEditor;
        }
        return null;
    }
    /**
     * TODO 拆分状态的兼容
     * 判断model是否已存在，在当前editor打开该model
     * @param input 输入的目标文件信息
     * @param source 触发的来源Editor，与grid关联使用
     * @param sideBySide ？
     */
    async openCodeEditor(
    // @ts-ignore
    input, source, sideBySide) {
        var _a, _b, _c, _d, _e, _f;
        const resourceUri = new ide_core_common_1.URI(input.resource.toString());
        // 判断打开下一个不同于当前编辑器的文件时，是否需要先固定当前编辑器Tab，从而避免被替换，例如：跳转到定义
        const enablePreviewFromCodeNavigation = this.preferenceService.get('editor.enablePreviewFromCodeNavigation');
        if (!enablePreviewFromCodeNavigation &&
            source &&
            !sideBySide &&
            !new ide_core_common_1.URI((_a = source.getModel()) === null || _a === void 0 ? void 0 : _a.uri).isEqual(input.resource)) {
            for (const visibleGroup of this.workbenchEditorService.editorGroups) {
                if (((_b = visibleGroup.currentOpenType) === null || _b === void 0 ? void 0 : _b.type) === common_1.EditorOpenType.code) {
                    if (((_c = visibleGroup.currentEditor) === null || _c === void 0 ? void 0 : _c.monacoEditor) === source) {
                        visibleGroup.pinPreviewed((_d = visibleGroup.currentResource) === null || _d === void 0 ? void 0 : _d.uri);
                        break;
                    }
                }
                else if (((_e = visibleGroup.currentOpenType) === null || _e === void 0 ? void 0 : _e.type) === common_1.EditorOpenType.diff) {
                    if (visibleGroup.diffEditor.modifiedEditor.monacoEditor === source ||
                        visibleGroup.diffEditor.originalEditor.monacoEditor === source) {
                        visibleGroup.pinPreviewed((_f = visibleGroup.currentResource) === null || _f === void 0 ? void 0 : _f.uri);
                        break;
                    }
                }
            }
        }
        let editorGroup = this.workbenchEditorService.currentEditorGroup;
        let index;
        if (source) {
            editorGroup =
                this.workbenchEditorService.editorGroups.find((g) => g.currentEditor && g.currentEditor.monacoEditor === source) || editorGroup;
            index = editorGroup.resources.findIndex((r) => editorGroup.currentResource && r.uri === editorGroup.currentResource.uri);
            if (index >= 0) {
                index++;
            }
        }
        const selection = input.options ? input.options.selection : null;
        let range;
        if (selection) {
            if (typeof selection.endLineNumber === 'number' && typeof selection.endColumn === 'number') {
                range = selection;
            }
            else {
                range = new monaco.Range(selection.startLineNumber, selection.startColumn, selection.startLineNumber, selection.startColumn);
            }
        }
        await editorGroup.open(resourceUri, { index, range: range, focus: true });
        return editorGroup.codeEditor.monacoEditor;
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(common_1.WorkbenchEditorService),
    tslib_1.__metadata("design:type", workbench_editor_service_1.WorkbenchEditorServiceImpl)
], MonacoCodeService.prototype, "workbenchEditorService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.PreferenceService),
    tslib_1.__metadata("design:type", Object)
], MonacoCodeService.prototype, "preferenceService", void 0);
MonacoCodeService = tslib_1.__decorate([
    (0, di_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [])
], MonacoCodeService);
exports.MonacoCodeService = MonacoCodeService;
// @ts-ignore
class MonacoContextViewService extends contextViewService_1.ContextViewService {
    constructor(codeEditorService) {
        super(new standaloneLayoutService_1.EditorScopedLayoutService(document.body, codeEditorService));
    }
    setContainer(container) {
        if (!this.menuContainer) {
            this.menuContainer = document.createElement('div');
            this.menuContainer.className = container.className;
            this.menuContainer.style.left = '0';
            this.menuContainer.style.top = '0';
            this.menuContainer.style.position = 'fixed';
            this.menuContainer.style.zIndex = '10';
            document.body.append(this.menuContainer);
        }
        super['setContainer'](this.menuContainer);
    }
}
exports.MonacoContextViewService = MonacoContextViewService;
//# sourceMappingURL=editor.override.js.map