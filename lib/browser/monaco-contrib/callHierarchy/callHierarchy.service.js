"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallHierarchyService = exports.CallHierarchyModel = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_common_1 = require("@opensumi/ide-core-common");
const callHierarchy_1 = require("@opensumi/ide-monaco/lib/browser/contrib/callHierarchy");
const types_1 = require("../../doc-model/types");
const { isNonEmptyArray } = ide_core_common_1.arrays;
/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
// Some code copied and modified from https://github.com/microsoft/vscode/tree/main/src/vs/workbench/contrib/callHierarchy/common/callHierarchy.ts
class CallHierarchyModel {
    static async create(model, position, token) {
        const [provider] = callHierarchy_1.CallHierarchyProviderRegistry.ordered(model);
        if (!provider) {
            return undefined;
        }
        const session = await provider.prepareCallHierarchy(model, position, token);
        if (!session) {
            return undefined;
        }
        return new CallHierarchyModel(session.roots.reduce((p, c) => p + c._sessionId, ''), provider, session.roots, new ide_core_common_1.RefCountedDisposable(session));
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
        return new (class extends CallHierarchyModel {
            constructor() {
                super(that.id, that.provider, [item], that.ref.acquire());
            }
        })();
    }
    async resolveIncomingCalls(item, token) {
        try {
            const result = await this.provider.provideIncomingCalls(item, token);
            if (isNonEmptyArray(result)) {
                return result;
            }
        }
        catch (e) {
            (0, ide_core_common_1.onUnexpectedExternalError)(e);
        }
        return [];
    }
    async resolveOutgoingCalls(item, token) {
        try {
            const result = await this.provider.provideOutgoingCalls(item, token);
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
exports.CallHierarchyModel = CallHierarchyModel;
let CallHierarchyService = class CallHierarchyService {
    constructor() {
        this.models = new Map();
    }
    registerCallHierarchyProvider(selector, provider) {
        callHierarchy_1.CallHierarchyProviderRegistry.register(selector, provider);
    }
    async prepareCallHierarchyProvider(resource, position) {
        var _a;
        let textModel = (_a = this.modelService.getModelReference(ide_core_common_1.URI.parse(resource.toString()))) === null || _a === void 0 ? void 0 : _a.instance.getMonacoModel();
        let textModelReference;
        if (!textModel) {
            const result = await this.modelService.createModelReference(ide_core_common_1.URI.parse(resource.toString()));
            textModel = result.instance.getMonacoModel();
            textModelReference = result;
        }
        try {
            const model = await CallHierarchyModel.create(textModel, position, ide_core_common_1.CancellationToken.None);
            if (!model) {
                return [];
            }
            //
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
    provideIncomingCalls(item) {
        const model = this.models.get(item._sessionId);
        if (!model) {
            return undefined;
        }
        return model.resolveIncomingCalls(item, ide_core_common_1.CancellationToken.None);
    }
    provideOutgoingCalls(item) {
        const model = this.models.get(item._sessionId);
        if (!model) {
            return undefined;
        }
        return model.resolveOutgoingCalls(item, ide_core_common_1.CancellationToken.None);
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(types_1.IEditorDocumentModelService),
    tslib_1.__metadata("design:type", Object)
], CallHierarchyService.prototype, "modelService", void 0);
CallHierarchyService = tslib_1.__decorate([
    (0, di_1.Injectable)()
], CallHierarchyService);
exports.CallHierarchyService = CallHierarchyService;
//# sourceMappingURL=callHierarchy.service.js.map