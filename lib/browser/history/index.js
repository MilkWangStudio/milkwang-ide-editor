"use strict";
var EditorHistoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorHistoryState = exports.EditorHistoryService = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const common_1 = require("../../common");
const types_1 = require("../types");
const HistoryPositionLineThreshold = 7;
const HardMaxStateLength = 200; // 超过200个过后，会缩减至100个, 防止反复缩减
const SoftMaxStateLength = 100;
let EditorHistoryService = EditorHistoryService_1 = class EditorHistoryService extends ide_core_browser_1.WithEventBus {
    constructor() {
        super(...arguments);
        this.currentIndex = -1;
        this.stack = [];
        this.closedStack = [];
    }
    init() {
        this.registerMouseNavigationListener();
    }
    registerMouseNavigationListener() {
        const disposables = new ide_core_browser_1.DisposableCollection();
        const handleMouseBackForwardSupport = () => {
            disposables.dispose();
            if (this.preferenceService.get(EditorHistoryService_1.MOUSE_NAVIGATION_SETTING)) {
                disposables.push((0, ide_core_browser_1.addDisposableListener)(window.document, ide_core_browser_1.EventType.MOUSE_DOWN, (e) => this.onMouseDown(e)));
            }
            this.disposables.push(disposables);
        };
        this.disposables.push(this.preferenceService.onSpecificPreferenceChange(EditorHistoryService_1.MOUSE_NAVIGATION_SETTING, () => {
            if (this.preferenceService.get(EditorHistoryService_1.MOUSE_NAVIGATION_SETTING)) {
                handleMouseBackForwardSupport();
            }
        }));
        handleMouseBackForwardSupport();
    }
    onMouseDown(event) {
        // Support to navigate in history when mouse buttons 4/5 are pressed
        switch (event.button) {
            case 3:
                event.stopPropagation();
                this.back();
                break;
            case 4:
                event.stopPropagation();
                this.forward();
                break;
        }
    }
    onEditorSelectionChangeEvent(e) {
        if (e.payload.selections[0]) {
            this.onNewState(new EditorHistoryState(e.payload.editorUri, {
                lineNumber: e.payload.selections[0].selectionStartLineNumber,
                column: e.payload.selections[0].selectionStartColumn,
            }, e.payload.group.index, false));
        }
    }
    onEditorGroupChangeEvent(e) {
        if (e.payload.newOpenType &&
            (e.payload.newOpenType.type === types_1.EditorOpenType.code || e.payload.newOpenType.type === types_1.EditorOpenType.diff)) {
            const selections = e.payload.group.currentEditor.getSelections();
            if (selections && selections.length > 0) {
                this.onNewState(new EditorHistoryState(e.payload.newResource.uri, {
                    lineNumber: selections[0].selectionStartLineNumber,
                    column: selections[0].selectionStartColumn,
                }, e.payload.group.index, true));
            }
        }
    }
    onEditorGroupCloseEvent(e) {
        this.pushClosed(e.payload.resource.uri);
    }
    onNewState(state) {
        if (this.currentIndex !== this.stack.length - 1) {
            if (state.isTabChange && this.currentState.isRelevant(state)) {
                //
                return;
            }
            if (this.currentState && this.currentState.isEqual(state)) {
                // 这个状态可能来自 back/forward 被调用产生的行为
                // 如果相同，不做任何行为
                return;
            }
        }
        const isRelevant = this.currentState && this.currentState.isRelevant(state);
        this.doPushState(state, isRelevant);
    }
    get currentState() {
        return this.stack[this.currentIndex];
    }
    doPushState(state, isRelevant) {
        // 如果和最新的状态关联， 则替换最新的状态
        this.stack.splice(this.currentIndex + (isRelevant ? 0 : 1));
        this.stack.push(state);
        if (this.stack.length > HardMaxStateLength) {
            this.stack.splice(0, this.stack.length - SoftMaxStateLength);
        }
        this.currentIndex = this.stack.length - 1;
    }
    forward() {
        if (this.currentIndex < this.stack.length - 1) {
            this.currentIndex++;
            this.restoreState(this.currentState);
        }
    }
    back() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.restoreState(this.currentState);
        }
    }
    restoreState(state) {
        if (!state) {
            return;
        }
        const editorGroup = this.editorService.editorGroups[state.groupIndex] || this.editorService.currentEditorGroup;
        editorGroup.open(state.uri, {
            range: {
                startColumn: state.position.column,
                startLineNumber: state.position.lineNumber,
                endColumn: state.position.column,
                endLineNumber: state.position.lineNumber,
            },
            focus: true,
        });
    }
    pushClosed(uri) {
        this.closedStack.push(uri);
        if (this.closedStack.length > HardMaxStateLength) {
            this.closedStack.splice(0, this.closedStack.length - SoftMaxStateLength);
        }
    }
    popClosed() {
        const uri = this.closedStack.pop();
        if (uri) {
            this.editorService.open(uri, {
                focus: true,
            });
            this.closedStack = this.closedStack.filter((u) => !uri.isEqual(u));
        }
    }
};
EditorHistoryService.MOUSE_NAVIGATION_SETTING = 'editor.mouseBackForwardToNavigate';
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.PreferenceService),
    tslib_1.__metadata("design:type", Object)
], EditorHistoryService.prototype, "preferenceService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(common_1.WorkbenchEditorService),
    tslib_1.__metadata("design:type", common_1.WorkbenchEditorService)
], EditorHistoryService.prototype, "editorService", void 0);
tslib_1.__decorate([
    (0, ide_core_browser_1.OnEvent)(types_1.EditorSelectionChangeEvent),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [types_1.EditorSelectionChangeEvent]),
    tslib_1.__metadata("design:returntype", void 0)
], EditorHistoryService.prototype, "onEditorSelectionChangeEvent", null);
tslib_1.__decorate([
    (0, ide_core_browser_1.OnEvent)(types_1.EditorGroupChangeEvent),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [types_1.EditorGroupChangeEvent]),
    tslib_1.__metadata("design:returntype", void 0)
], EditorHistoryService.prototype, "onEditorGroupChangeEvent", null);
tslib_1.__decorate([
    (0, ide_core_browser_1.OnEvent)(types_1.EditorGroupCloseEvent),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [types_1.EditorGroupCloseEvent]),
    tslib_1.__metadata("design:returntype", void 0)
], EditorHistoryService.prototype, "onEditorGroupCloseEvent", null);
EditorHistoryService = EditorHistoryService_1 = tslib_1.__decorate([
    (0, di_1.Injectable)()
], EditorHistoryService);
exports.EditorHistoryService = EditorHistoryService;
class EditorHistoryState {
    constructor(uri, position, groupIndex, isTabChange) {
        this.uri = uri;
        this.position = position;
        this.groupIndex = groupIndex;
        this.isTabChange = isTabChange;
    }
    isRelevant(anotherState) {
        if (this.uri.isEqual(anotherState.uri)) {
            if (anotherState.position.lineNumber < this.position.lineNumber + HistoryPositionLineThreshold &&
                anotherState.position.lineNumber > this.position.lineNumber - HistoryPositionLineThreshold) {
                return true;
            }
            if (this.isTabChange || anotherState.isTabChange) {
                // 如果是 tabChange 类型，我们认为是相关的，这样防止无意义的 0 line 0 column 状态出现
                return true;
            }
        }
        return false;
    }
    isEqual(anotherState) {
        return (this.uri.isEqual(anotherState.uri) &&
            this.position.lineNumber === anotherState.position.lineNumber &&
            this.position.column === anotherState.position.column);
    }
}
exports.EditorHistoryState = EditorHistoryState;
//# sourceMappingURL=index.js.map