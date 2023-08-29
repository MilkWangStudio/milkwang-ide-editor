"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSplitActionFromDragDrop = void 0;
const editor_1 = require("./editor");
function getSplitActionFromDragDrop(position) {
    return {
        [editor_1.DragOverPosition.LEFT]: editor_1.EditorGroupSplitAction.Left,
        [editor_1.DragOverPosition.RIGHT]: editor_1.EditorGroupSplitAction.Right,
        [editor_1.DragOverPosition.BOTTOM]: editor_1.EditorGroupSplitAction.Bottom,
        [editor_1.DragOverPosition.TOP]: editor_1.EditorGroupSplitAction.Top,
    }[position];
}
exports.getSplitActionFromDragDrop = getSplitActionFromDragDrop;
//# sourceMappingURL=utils.js.map