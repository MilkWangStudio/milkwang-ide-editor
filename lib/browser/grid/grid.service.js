"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitDirectionMatches = exports.SplitDirection = exports.EditorGrid = exports.editorGridUid = void 0;
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const ide_core_common_1 = require("@opensumi/ide-core-common");
const common_1 = require("../../common");
const types_1 = require("../types");
exports.editorGridUid = new Set();
class EditorGrid {
    constructor(parent) {
        this.parent = parent;
        this.editorGroup = null;
        this.children = [];
        this._onDidGridStateChange = new ide_core_browser_1.Emitter();
        this.onDidGridStateChange = this._onDidGridStateChange.event;
        this._onDidGridAndDesendantStateChange = new ide_core_browser_1.Emitter();
        this.onDidGridAndDesendantStateChange = this._onDidGridAndDesendantStateChange.event;
        let uid = (0, ide_core_common_1.makeRandomHexString)(5);
        while (exports.editorGridUid.has(uid)) {
            uid = (0, ide_core_common_1.makeRandomHexString)(5);
        }
        this.uid = uid;
        exports.editorGridUid.add(uid);
        this.onDidGridStateChange(() => {
            var _a;
            this._onDidGridAndDesendantStateChange.fire();
            (_a = this.parent) === null || _a === void 0 ? void 0 : _a._onDidGridAndDesendantStateChange.fire();
        });
    }
    setEditorGroup(editorGroup) {
        this.editorGroup = editorGroup;
        editorGroup.grid = this;
        this.splitDirection = undefined;
    }
    // 当前 grid 作为 parent ，原有 grid 与新增 grid 作为子元素
    generateSplitParent(direction, editorGroup, before) {
        this.splitDirection = direction;
        const originalChild = new EditorGrid(this);
        originalChild.setEditorGroup(this.editorGroup);
        this.editorGroup = null;
        const newGrid = new EditorGrid(this);
        newGrid.setEditorGroup(editorGroup);
        if (before) {
            this.children = [newGrid, originalChild];
        }
        else {
            this.children = [originalChild, newGrid];
        }
        this._onDidGridStateChange.fire();
    }
    // 新增 grid 与当前 grid 作为同一父 grid 的子元素
    generateSplitSibling(editorGroup, before) {
        if (this.parent) {
            const index = this.parent.children.indexOf(this);
            const newGrid = new EditorGrid(this.parent);
            newGrid.setEditorGroup(editorGroup);
            if (before) {
                this.parent.children.splice(index, 0, newGrid);
            }
            else {
                this.parent.children.splice(index + 1, 0, newGrid);
            }
            this.parent._onDidGridStateChange.fire();
        }
    }
    split(direction, editorGroup, before) {
        // 由于split永远只会从未分割的含有editorGroup的grid发出
        // 父元素不含有实际渲染 ui
        if (!this.splitDirection) {
            // 顶层 grid 且未有指定方向，生成初始父级单元
            if (!this.parent) {
                this.generateSplitParent(direction, editorGroup, before);
                // 非顶层 grid
            }
            else {
                // 与父元素方向一致，则为同级子元素
                if (this.parent.splitDirection === direction) {
                    this.generateSplitSibling(editorGroup, before);
                    // 与父元素方向不一致，则生成为父级单元
                }
                else if (this.parent.splitDirection !== direction) {
                    this.generateSplitParent(direction, editorGroup, before);
                }
            }
        }
    }
    dispose() {
        if (this.editorGroup) {
            this.editorGroup = null;
            if (!this.parent) {
                return; // geng
            }
            const index = this.parent.children.indexOf(this);
            this.parent.children.splice(index, 1);
            if (this.parent.children.length === 1) {
                this.parent.replaceBy(this.parent.children[0]);
            }
            this.parent._onDidGridStateChange.fire();
        }
        else {
            // 应该不会落入这里
        }
    }
    replaceBy(target) {
        if (target.editorGroup) {
            this.setEditorGroup(target.editorGroup);
        }
        this.splitDirection = target.splitDirection;
        this.children.splice(0, this.children.length, ...target.children.splice(0, target.children.length));
        this.children.forEach((grid) => {
            grid.parent = this;
        });
        if (this.parent) {
            this.parent._onDidGridStateChange.fire();
        }
    }
    emitResizeWithEventBus(eventBus) {
        eventBus.fire(new types_1.GridResizeEvent({ gridId: this.uid }));
        this.children.forEach((c) => {
            c.emitResizeWithEventBus(eventBus);
        });
    }
    serialize() {
        if (this.editorGroup) {
            const editorGroupState = this.editorGroup.getState();
            if (this.parent && editorGroupState.uris.length === 0) {
                return null;
            }
            return {
                editorGroup: editorGroupState,
            };
        }
        else {
            if (this.parent && this.children.length === 0) {
                return null;
            }
            const children = this.children.map((c) => c.serialize()).filter((c) => !!c);
            if (children.length === 1) {
                // 只有一个孩子，直接覆盖
                return children[0];
            }
            return {
                splitDirection: this.splitDirection,
                children,
            };
        }
    }
    async deserialize(state, editorGroupFactory, editorGroupRestoreStatePromises) {
        const promises = [];
        if (state.editorGroup) {
            this.setEditorGroup(editorGroupFactory());
            editorGroupRestoreStatePromises.push(this.editorGroup.restoreState(state.editorGroup));
        }
        else {
            this.splitDirection = state.splitDirection;
            this.children = (state.children || []).map((c) => {
                const grid = new EditorGrid(this);
                promises.push(grid.deserialize(c, editorGroupFactory, editorGroupRestoreStatePromises));
                return grid;
            });
        }
        return Promise.all(promises);
    }
    findGird(direction, currentIndex = 0) {
        if (this.splitDirection && splitDirectionMatches(this.splitDirection, direction)) {
            const targetIndex = currentIndex + (direction === common_1.Direction.LEFT || direction === common_1.Direction.UP ? -1 : 1);
            if (this.children[targetIndex]) {
                return this.children[targetIndex].getFirstLeaf();
            }
        }
        if (!this.parent) {
            return null;
        }
        else {
            return this.parent.findGird(direction, this.parent.children.indexOf(this));
        }
    }
    getFirstLeaf() {
        if (this.editorGroup) {
            return this;
        }
        else {
            if (this.children.length > 0) {
                return this.children[0].getFirstLeaf();
            }
            else {
                return null;
            }
        }
    }
    sortEditorGroups(results) {
        if (this.editorGroup) {
            results.push(this.editorGroup);
        }
        else {
            if (this.children.length > 0) {
                this.children.forEach((children) => {
                    children.sortEditorGroups(results);
                });
            }
        }
    }
    move(direction) {
        if (this.parent) {
            if (this.parent.splitDirection === SplitDirection.Horizontal) {
                if (direction === common_1.Direction.LEFT) {
                    const index = this.parent.children.indexOf(this);
                    if (index > 0) {
                        this.parent.children.splice(index, 1);
                        this.parent.children.splice(index - 1, 0, this);
                        this.parent._onDidGridStateChange.fire();
                    }
                }
                else if (direction === common_1.Direction.RIGHT) {
                    const index = this.parent.children.indexOf(this);
                    if (index < this.parent.children.length) {
                        this.parent.children.splice(index, 1);
                        this.parent.children.splice(index + 1, 0, this);
                        this.parent._onDidGridStateChange.fire();
                    }
                }
            }
            else if (this.parent.splitDirection === SplitDirection.Vertical) {
                if (direction === common_1.Direction.UP) {
                    const index = this.parent.children.indexOf(this);
                    if (index > 0) {
                        this.parent.children.splice(index, 1);
                        this.parent.children.splice(index - 1, 0, this);
                        this.parent._onDidGridStateChange.fire();
                    }
                }
                else if (direction === common_1.Direction.DOWN) {
                    const index = this.parent.children.indexOf(this);
                    if (index < this.parent.children.length) {
                        this.parent.children.splice(index, 1);
                        this.parent.children.splice(index + 1, 0, this);
                        this.parent._onDidGridStateChange.fire();
                    }
                }
            }
        }
    }
}
exports.EditorGrid = EditorGrid;
var SplitDirection;
(function (SplitDirection) {
    // 水平拆分
    SplitDirection[SplitDirection["Horizontal"] = 1] = "Horizontal";
    // 垂直拆分
    SplitDirection[SplitDirection["Vertical"] = 2] = "Vertical";
})(SplitDirection = exports.SplitDirection || (exports.SplitDirection = {}));
function splitDirectionMatches(split, direction) {
    if (direction === common_1.Direction.UP || direction === common_1.Direction.DOWN) {
        return split === SplitDirection.Vertical;
    }
    if (direction === common_1.Direction.LEFT || direction === common_1.Direction.RIGHT) {
        return split === SplitDirection.Horizontal;
    }
    return false;
}
exports.splitDirectionMatches = splitDirectionMatches;
//# sourceMappingURL=grid.service.js.map