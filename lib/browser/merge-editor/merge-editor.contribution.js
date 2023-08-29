"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MergeEditorContribution = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const types_1 = require("../types");
const merge_editor_provider_1 = require("./merge-editor.provider");
const MergeEditorFloatComponents_1 = require("./MergeEditorFloatComponents");
const MERGE_EDITOR_FLOATING_WIDGET = 'merge.editor.floating.widget';
let MergeEditorContribution = class MergeEditorContribution extends ide_core_browser_1.Disposable {
    registerResource(resourceService) {
        resourceService.registerResourceProvider(this.mergeEditorResourceProvider);
    }
    registerEditorComponent(registry) {
        registry.registerEditorComponentResolver(types_1.EditorOpenType.mergeEditor, (_, results) => {
            results.push({
                type: types_1.EditorOpenType.mergeEditor,
            });
        });
        registry.registerEditorSideWidget({
            id: MERGE_EDITOR_FLOATING_WIDGET,
            component: MergeEditorFloatComponents_1.MergeEditorFloatComponents,
            displaysOnResource: (resource) => {
                const { uri } = resource;
                if (uri.scheme !== ide_core_browser_1.Schemes.file) {
                    return false;
                }
                const mergeChanges = this.contextKeyService.getValue('git.mergeChanges') || [];
                return mergeChanges.some((value) => value.toString() === uri.toString());
            },
        });
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(),
    tslib_1.__metadata("design:type", merge_editor_provider_1.MergeEditorResourceProvider)
], MergeEditorContribution.prototype, "mergeEditorResourceProvider", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.IContextKeyService),
    tslib_1.__metadata("design:type", Object)
], MergeEditorContribution.prototype, "contextKeyService", void 0);
MergeEditorContribution = tslib_1.__decorate([
    (0, ide_core_browser_1.Domain)(types_1.BrowserEditorContribution)
], MergeEditorContribution);
exports.MergeEditorContribution = MergeEditorContribution;
//# sourceMappingURL=merge-editor.contribution.js.map