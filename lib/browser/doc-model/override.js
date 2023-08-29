"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonacoTextModelService = void 0;
const tslib_1 = require("tslib");
/* istanbul ignore file */
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const types_1 = require("./types");
let MonacoTextModelService = class MonacoTextModelService {
    canHandleResource(resource) {
        return true;
    }
    hasTextModelContentProvider(scheme) {
        throw new Error('Method not implemented.');
    }
    async createModelReference(resource) {
        const docModelRef = await this.documentModelManager.createModelReference(new ide_core_browser_1.URI(resource.toString()), 'monaco');
        if (docModelRef) {
            const model = docModelRef.instance.getMonacoModel();
            return Promise.resolve({
                object: {
                    textEditorModel: model,
                },
                dispose: () => {
                    docModelRef.dispose();
                },
            });
        }
    }
    registerTextModelContentProvider(scheme, provider) {
        return {
            dispose() {
                // no-op
            },
        };
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(types_1.IEditorDocumentModelService),
    tslib_1.__metadata("design:type", Object)
], MonacoTextModelService.prototype, "documentModelManager", void 0);
MonacoTextModelService = tslib_1.__decorate([
    (0, di_1.Injectable)()
], MonacoTextModelService);
exports.MonacoTextModelService = MonacoTextModelService;
//# sourceMappingURL=override.js.map