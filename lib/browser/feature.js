"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorFeatureRegistryImpl = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const { addElement } = ide_core_browser_1.arrays;
let EditorFeatureRegistryImpl = class EditorFeatureRegistryImpl {
    constructor() {
        this.contributions = [];
        this._onDidRegisterFeature = new ide_core_browser_1.Emitter();
        this.onDidRegisterFeature = this._onDidRegisterFeature.event;
    }
    registerEditorFeatureContribution(contribution) {
        const disposer = addElement(this.contributions, contribution);
        this._onDidRegisterFeature.fire(contribution);
        return disposer;
    }
    runContributions(editor) {
        this.contributions.forEach((contribution) => {
            this.runOneContribution(editor, contribution);
        });
    }
    async runProvideEditorOptionsForUri(uri) {
        const result = await Promise.all(this.contributions.map((contribution) => {
            if (contribution.provideEditorOptionsForUri) {
                return contribution.provideEditorOptionsForUri(uri);
            }
            else {
                return {};
            }
        }));
        return result.reduce((pre, current) => (Object.assign(Object.assign({}, pre), current)), {});
    }
    runOneContribution(editor, contribution) {
        try {
            const disposer = contribution.contribute(editor);
            editor.onDispose(() => {
                disposer.dispose();
            });
        }
        catch (e) {
            this.logger.error(e);
        }
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.ILogger),
    tslib_1.__metadata("design:type", Object)
], EditorFeatureRegistryImpl.prototype, "logger", void 0);
EditorFeatureRegistryImpl = tslib_1.__decorate([
    (0, di_1.Injectable)()
], EditorFeatureRegistryImpl);
exports.EditorFeatureRegistryImpl = EditorFeatureRegistryImpl;
//# sourceMappingURL=feature.js.map