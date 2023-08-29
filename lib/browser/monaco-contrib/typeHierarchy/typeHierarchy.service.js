"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeHierarchyService = exports.TypeHierarchyModel = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_common_1 = require("@opensumi/ide-core-common");
const typeHierarchy_1 = require("@opensumi/ide-monaco/lib/browser/contrib/typeHierarchy");
const types_1 = require("../../doc-model/types");
const { isNonEmptyArray } = ide_core_common_1.arrays;
class TypeHierarchyModel {
    static async create(model, position, token) {
        const [provider] = typeHierarchy_1.TypeHierarchyProviderRegistry.ordered(model);
        if (!provider) {
            return undefined;
        }
        const session = await provider.prepareTypeHierarchy(model, position, token);
        if (!session) {
            return undefined;
        }
        return new TypeHierarchyModel(session.roots.reduce((p, c) => p + c._sessionId, ''), provider, session.roots, new ide_core_common_1.RefCountedDisposable(session));
    }
    constructor(id, provider, roots, ref) {
        this.id = id;
        this.provider = provider;
        this.roots = roots;
        this.ref = ref;
        this.root = roots[0];
    }
    dispose() {
        this.ref.release();
    }
    fork(item) {
        const that = this;
        return new (class extends TypeHierarchyModel {
            constructor() {
                super(that.id, that.provider, [item], that.ref.acquire());
            }
        })();
    }
    async provideSupertypes(item, token) {
        try {
            const result = await this.provider.provideSupertypes(item, token);
            if (isNonEmptyArray(result)) {
                return result;
            }
        }
        catch (e) {
            (0, ide_core_common_1.onUnexpectedExternalError)(e);
        }
        return [];
    }
    async provideSubtypes(item, token) {
        try {
            const result = await this.provider.provideSubtypes(item, token);
            if (isNonEmptyArray(result)) {
                return result;
            }
        }
        catch (e) {
            (0, ide_core_common_1.onUnexpectedExternalError)(e);
        }
        return [];
    }
}
exports.TypeHierarchyModel = TypeHierarchyModel;
let TypeHierarchyService = class TypeHierarchyService {
    constructor() {
        this.models = new Map();
    }
    registerTypeHierarchyProvider(selector, provider) {
        typeHierarchy_1.TypeHierarchyProviderRegistry.register(selector, provider);
    }
    async prepareTypeHierarchyProvider(resource, position) {
        var _a;
        let textModel = (_a = this.modelService.getModelReference(ide_core_common_1.URI.parse(resource.toString()))) === null || _a === void 0 ? void 0 : _a.instance.getMonacoModel();
        let textModelReference;
        if (!textModel) {
            const result = await this.modelService.createModelReference(ide_core_common_1.URI.parse(resource.toString()));
            textModel = result.instance.getMonacoModel();
            textModelReference = result;
        }
        try {
            const model = await TypeHierarchyModel.create(textModel, position, ide_core_common_1.CancellationToken.None);
            if (!model) {
                return [];
            }
            this.models.set(model.id, model);
            this.models.forEach((value, key, map) => {
                if (map.size > 10) {
                    value.dispose();
                    this.models.delete(key);
                }
            });
            return [model.root];
        }
        finally {
            textModelReference === null || textModelReference === void 0 ? void 0 : textModelReference.dispose();
        }
    }
    async provideSupertypes(item) {
        // find model
        const model = this.models.get(item._sessionId);
        if (!model) {
            return undefined;
        }
        return model.provideSupertypes(item, ide_core_common_1.CancellationToken.None);
    }
    async provideSubtypes(item) {
        // find model
        const model = this.models.get(item._sessionId);
        if (!model) {
            return undefined;
        }
        return model.provideSubtypes(item, ide_core_common_1.CancellationToken.None);
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(types_1.IEditorDocumentModelService),
    tslib_1.__metadata("design:type", Object)
], TypeHierarchyService.prototype, "modelService", void 0);
TypeHierarchyService = tslib_1.__decorate([
    (0, di_1.Injectable)()
], TypeHierarchyService);
exports.TypeHierarchyService = TypeHierarchyService;
//# sourceMappingURL=typeHierarchy.service.js.map