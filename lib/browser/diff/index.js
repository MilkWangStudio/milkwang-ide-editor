"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultDiffEditorContribution = exports.DiffResourceProvider = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const services_1 = require("@opensumi/ide-core-browser/lib/services");
const ide_file_service_1 = require("@opensumi/ide-file-service");
const common_1 = require("../../common");
const types_1 = require("../types");
// diff URI:
// diff://?name=tabName&original=uri1&modified=uri2
// 例子:
// diff://?name=a.ts(on disk)<=>a.ts&original=file://path/to/a.ts&modified=fileOnDisk://path/to/a.ts
let DiffResourceProvider = class DiffResourceProvider extends ide_core_browser_1.WithEventBus {
    constructor() {
        super(...arguments);
        this.scheme = 'diff';
        this.modifiedToResource = new Map();
    }
    onResourceDecorationChangeEvent(e) {
        if (e.payload.uri && this.modifiedToResource.has(e.payload.uri.toString())) {
            this.eventBus.fire(new common_1.ResourceDecorationChangeEvent({
                uri: this.modifiedToResource.get(e.payload.uri.toString()),
                decoration: e.payload.decoration,
            }));
        }
    }
    async getCurrentUserHome() {
        if (!this.userhomePath) {
            try {
                const userhome = await this.fileServiceClient.getCurrentUserHome();
                if (userhome) {
                    this.userhomePath = new ide_core_browser_1.URI(userhome.uri);
                }
            }
            catch (err) { }
        }
        return this.userhomePath;
    }
    async getReadableTooltip(path) {
        const pathStr = path.toString();
        const userhomePath = await this.getCurrentUserHome();
        if (!userhomePath) {
            return decodeURIComponent(path.withScheme('').toString());
        }
        if (userhomePath.isEqualOrParent(path)) {
            const userhomePathStr = userhomePath && userhomePath.toString();
            return decodeURIComponent(pathStr.replace(userhomePathStr, '~'));
        }
        return decodeURIComponent(path.withScheme('').toString());
    }
    async provideResource(uri) {
        const { original, modified, name } = uri.getParsedQuery();
        const originalUri = new ide_core_browser_1.URI(original);
        const modifiedUri = new ide_core_browser_1.URI(modified);
        this.modifiedToResource.set(modifiedUri.toString(), uri);
        return Promise.all([
            this.labelService.getIcon(originalUri),
            // 默认显示 modified 文件路径
            this.getReadableTooltip(modifiedUri),
        ]).then(([icon, title]) => ({
            name,
            icon,
            uri,
            metadata: {
                original: originalUri,
                modified: modifiedUri,
            },
            title,
        }));
    }
    async shouldCloseResource(resource, openedResources) {
        const { modified } = resource.uri.getParsedQuery();
        const modifiedUri = new ide_core_browser_1.URI(modified);
        const modifiedResource = await this.resourceService.getResource(modifiedUri);
        if (modifiedResource) {
            return await this.resourceService.shouldCloseResource(modifiedResource, openedResources);
        }
        return true;
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(),
    tslib_1.__metadata("design:type", services_1.LabelService)
], DiffResourceProvider.prototype, "labelService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(common_1.ResourceService),
    tslib_1.__metadata("design:type", common_1.ResourceService)
], DiffResourceProvider.prototype, "resourceService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_file_service_1.IFileServiceClient),
    tslib_1.__metadata("design:type", Object)
], DiffResourceProvider.prototype, "fileServiceClient", void 0);
tslib_1.__decorate([
    (0, ide_core_browser_1.OnEvent)(common_1.ResourceDecorationChangeEvent),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [common_1.ResourceDecorationChangeEvent]),
    tslib_1.__metadata("design:returntype", void 0)
], DiffResourceProvider.prototype, "onResourceDecorationChangeEvent", null);
DiffResourceProvider = tslib_1.__decorate([
    (0, di_1.Injectable)()
], DiffResourceProvider);
exports.DiffResourceProvider = DiffResourceProvider;
let DefaultDiffEditorContribution = class DefaultDiffEditorContribution {
    registerResource(resourceService) {
        resourceService.registerResourceProvider(this.diffResourceProvider);
    }
    registerEditorComponent(registry) {
        registry.registerEditorComponentResolver('diff', (resource, results) => {
            results.push({
                type: types_1.EditorOpenType.diff,
            });
        });
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(),
    tslib_1.__metadata("design:type", DiffResourceProvider)
], DefaultDiffEditorContribution.prototype, "diffResourceProvider", void 0);
DefaultDiffEditorContribution = tslib_1.__decorate([
    (0, ide_core_browser_1.Domain)(types_1.BrowserEditorContribution)
], DefaultDiffEditorContribution);
exports.DefaultDiffEditorContribution = DefaultDiffEditorContribution;
//# sourceMappingURL=index.js.map