"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MergeEditorResourceProvider = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const merge_editor_service_1 = require("@opensumi/ide-monaco/lib/browser/contrib/merge-editor/merge-editor.service");
let MergeEditorResourceProvider = class MergeEditorResourceProvider extends ide_core_browser_1.WithEventBus {
    constructor() {
        super(...arguments);
        this.scheme = 'mergeEditor';
    }
    provideResource(uri) {
        const { openMetadata, name } = uri.getParsedQuery();
        try {
            const parseMetaData = JSON.parse(openMetadata);
            const { ancestor, input1, input2, output } = parseMetaData;
            const resultEditorUri = new ide_core_browser_1.URI(output);
            const icon = this.labelService.getIcon(resultEditorUri);
            return {
                name,
                icon,
                uri,
                metadata: {
                    ancestor,
                    input1,
                    input2,
                    output,
                },
            };
        }
        catch (error) {
            throw Error('invalid merge editor resource parse');
        }
    }
    shouldCloseResource(resource, openedResources) {
        const { openMetadata } = resource.uri.getParsedQuery();
        try {
            const parseMetaData = JSON.parse(openMetadata);
            const { output } = parseMetaData;
            const outputUri = new ide_core_browser_1.URI(output);
            this.mergeEditorService.fireRestoreState(outputUri);
            return true;
        }
        catch (error) {
            throw Error('invalid merge editor resource parse');
        }
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.LabelService),
    tslib_1.__metadata("design:type", ide_core_browser_1.LabelService)
], MergeEditorResourceProvider.prototype, "labelService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(merge_editor_service_1.MergeEditorService),
    tslib_1.__metadata("design:type", merge_editor_service_1.MergeEditorService)
], MergeEditorResourceProvider.prototype, "mergeEditorService", void 0);
MergeEditorResourceProvider = tslib_1.__decorate([
    (0, di_1.Injectable)()
], MergeEditorResourceProvider);
exports.MergeEditorResourceProvider = MergeEditorResourceProvider;
//# sourceMappingURL=merge-editor.provider.js.map