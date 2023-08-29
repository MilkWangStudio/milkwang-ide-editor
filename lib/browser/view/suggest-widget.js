"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorSuggestWidgetContribution = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const ide_core_browser_2 = require("@opensumi/ide-core-browser");
const ide_core_common_1 = require("@opensumi/ide-core-common");
const suggestController_1 = require("@opensumi/monaco-editor-core/esm/vs/editor/contrib/suggest/browser/suggestController");
let EditorSuggestWidgetContribution = class EditorSuggestWidgetContribution {
    contribute(editor) {
        const disposable = new ide_core_browser_2.DisposableCollection();
        const suggestController = editor.monacoEditor.getContribution(suggestController_1.SuggestController.ID);
        if (suggestController && suggestController.widget && suggestController.widget.value) {
            const suggestWidget = suggestController.widget.value;
            // FIXME: 仅通过鼠标选中会走onDidSelect事件，键盘会过acceptSelectedSuggestionOnEnter这个command
            disposable.push(suggestWidget.onDidSelect((e) => {
                this.eventBus.fire(new ide_core_browser_2.SuggestEvent({
                    eventType: 'onDidSelect',
                    data: e,
                }));
            }));
            disposable.push(suggestWidget.onDidHide((e) => {
                this.eventBus.fire(new ide_core_browser_2.SuggestEvent({
                    eventType: 'onDidHide',
                    data: e,
                }));
            }));
            disposable.push(suggestWidget.onDidShow((e) => {
                this.eventBus.fire(new ide_core_browser_2.SuggestEvent({
                    eventType: 'onDidShow',
                    data: e,
                }));
            }));
            disposable.push(suggestWidget.onDidFocus((e) => {
                this.eventBus.fire(new ide_core_browser_2.SuggestEvent({
                    eventType: 'onDidFocus',
                    data: e,
                }));
            }));
            /**
             * 控制 suggestController 的默认行为，如 `suggest details 默认展开`
             */
            // @ts-ignore
            if (suggestWidget && suggestWidget._setDetailsVisible) {
                // @ts-ignore
                suggestWidget._setDetailsVisible(this.preferenceService.get('editor.suggest.details.visible', true));
            }
        }
        return disposable;
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_common_1.IEventBus),
    tslib_1.__metadata("design:type", Object)
], EditorSuggestWidgetContribution.prototype, "eventBus", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.PreferenceService),
    tslib_1.__metadata("design:type", Object)
], EditorSuggestWidgetContribution.prototype, "preferenceService", void 0);
EditorSuggestWidgetContribution = tslib_1.__decorate([
    (0, di_1.Injectable)()
], EditorSuggestWidgetContribution);
exports.EditorSuggestWidgetContribution = EditorSuggestWidgetContribution;
//# sourceMappingURL=suggest-widget.js.map