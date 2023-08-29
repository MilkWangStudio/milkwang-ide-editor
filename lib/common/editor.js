"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSimpleEditorOptions = exports.AUTO_SAVE_MODE = exports.SaveReason = exports.Direction = exports.EditorGroupSplitAction = exports.DragOverPosition = exports.EditorOpenType = exports.IEditorPriority = exports.OverviewRulerLane = exports.WorkbenchEditorService = exports.DidApplyEditorDecorationFromProvider = exports.DidChangeEditorGroupUriEvent = exports.CollectionEditorsUpdateEvent = exports.EditorCollectionService = exports.EditorType = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_common_1 = require("@opensumi/ide-core-common");
var EditorType;
(function (EditorType) {
    /**
     * 普通编辑器
     */
    EditorType[EditorType["CODE"] = 0] = "CODE";
    /**
     * 原始对比编辑器(左侧)
     */
    EditorType[EditorType["ORIGINAL_DIFF"] = 1] = "ORIGINAL_DIFF";
    /**
     * 修改对比编辑器(右侧)
     */
    EditorType[EditorType["MODIFIED_DIFF"] = 2] = "MODIFIED_DIFF";
    /**
     * 3-way 编辑器
     */
    EditorType["MERGE_EDITOR_DIFF"] = "MERGE_EDITOR_DIFF";
})(EditorType = exports.EditorType || (exports.EditorType = {}));
let EditorCollectionService = class EditorCollectionService {
};
EditorCollectionService = tslib_1.__decorate([
    (0, di_1.Injectable)()
], EditorCollectionService);
exports.EditorCollectionService = EditorCollectionService;
/**
 * 当前显示的Editor列表发生变化时
 */
class CollectionEditorsUpdateEvent extends ide_core_common_1.BasicEvent {
}
exports.CollectionEditorsUpdateEvent = CollectionEditorsUpdateEvent;
/**
 * 当EditorGroup中打开的uri发生改变时
 */
class DidChangeEditorGroupUriEvent extends ide_core_common_1.BasicEvent {
}
exports.DidChangeEditorGroupUriEvent = DidChangeEditorGroupUriEvent;
/**
 * 当 Decoration Provider 收集完 monaco decoration option 并设置后
 */
class DidApplyEditorDecorationFromProvider extends ide_core_common_1.BasicEvent {
}
exports.DidApplyEditorDecorationFromProvider = DidApplyEditorDecorationFromProvider;
class WorkbenchEditorService {
}
exports.WorkbenchEditorService = WorkbenchEditorService;
var OverviewRulerLane;
(function (OverviewRulerLane) {
    OverviewRulerLane[OverviewRulerLane["Left"] = 1] = "Left";
    OverviewRulerLane[OverviewRulerLane["Center"] = 2] = "Center";
    OverviewRulerLane[OverviewRulerLane["Right"] = 4] = "Right";
    OverviewRulerLane[OverviewRulerLane["Full"] = 7] = "Full";
})(OverviewRulerLane = exports.OverviewRulerLane || (exports.OverviewRulerLane = {}));
var IEditorPriority;
(function (IEditorPriority) {
    IEditorPriority["builtin"] = "builtin";
    IEditorPriority["option"] = "option";
    IEditorPriority["exclusive"] = "exclusive";
    IEditorPriority["default"] = "default";
})(IEditorPriority = exports.IEditorPriority || (exports.IEditorPriority = {}));
var EditorOpenType;
(function (EditorOpenType) {
    EditorOpenType["code"] = "code";
    EditorOpenType["diff"] = "diff";
    EditorOpenType["mergeEditor"] = "mergeEditor";
    EditorOpenType["component"] = "component";
})(EditorOpenType = exports.EditorOpenType || (exports.EditorOpenType = {}));
var DragOverPosition;
(function (DragOverPosition) {
    DragOverPosition["LEFT"] = "left";
    DragOverPosition["RIGHT"] = "right";
    DragOverPosition["TOP"] = "top";
    DragOverPosition["BOTTOM"] = "bottom";
    DragOverPosition["CENTER"] = "center";
})(DragOverPosition = exports.DragOverPosition || (exports.DragOverPosition = {}));
var EditorGroupSplitAction;
(function (EditorGroupSplitAction) {
    EditorGroupSplitAction[EditorGroupSplitAction["Top"] = 1] = "Top";
    EditorGroupSplitAction[EditorGroupSplitAction["Bottom"] = 2] = "Bottom";
    EditorGroupSplitAction[EditorGroupSplitAction["Left"] = 3] = "Left";
    EditorGroupSplitAction[EditorGroupSplitAction["Right"] = 4] = "Right";
})(EditorGroupSplitAction = exports.EditorGroupSplitAction || (exports.EditorGroupSplitAction = {}));
var Direction;
(function (Direction) {
    Direction["UP"] = "up";
    Direction["DOWN"] = "down";
    Direction["LEFT"] = "left";
    Direction["RIGHT"] = "right";
})(Direction = exports.Direction || (exports.Direction = {}));
var SaveReason;
(function (SaveReason) {
    SaveReason[SaveReason["Manual"] = 1] = "Manual";
    SaveReason[SaveReason["AfterDelay"] = 2] = "AfterDelay";
    SaveReason[SaveReason["FocusOut"] = 3] = "FocusOut";
})(SaveReason = exports.SaveReason || (exports.SaveReason = {}));
var AUTO_SAVE_MODE;
(function (AUTO_SAVE_MODE) {
    AUTO_SAVE_MODE.OFF = 'off';
    AUTO_SAVE_MODE.AFTER_DELAY = 'afterDelay';
    AUTO_SAVE_MODE.EDITOR_FOCUS_CHANGE = 'editorFocusChange';
    AUTO_SAVE_MODE.WINDOWS_LOST_FOCUS = 'windowLostFocus';
})(AUTO_SAVE_MODE = exports.AUTO_SAVE_MODE || (exports.AUTO_SAVE_MODE = {}));
// 获取最基础的MonacoEditor配置
function getSimpleEditorOptions() {
    return {
        fontSize: 12,
        fontWeight: 'normal',
        lineHeight: 0,
        wordWrap: 'on',
        overviewRulerLanes: 0,
        glyphMargin: false,
        lineNumbers: 'off',
        folding: false,
        selectOnLineNumbers: false,
        hideCursorInOverviewRuler: true,
        selectionHighlight: false,
        scrollbar: {
            horizontal: 'hidden',
        },
        lineDecorationsWidth: 0,
        overviewRulerBorder: false,
        scrollBeyondLastLine: false,
        renderLineHighlight: 'none',
        fixedOverflowWidgets: true,
        acceptSuggestionOnEnter: 'smart',
        minimap: {
            enabled: false,
        },
        guides: {
            highlightActiveIndentation: false,
            indentation: false,
            bracketPairs: false,
        },
    };
}
exports.getSimpleEditorOptions = getSimpleEditorOptions;
//# sourceMappingURL=editor.js.map