"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceServiceImpl = void 0;
const tslib_1 = require("tslib");
const mobx_1 = require("mobx");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const ide_core_common_1 = require("@opensumi/ide-core-common");
const common_1 = require("../common");
const { addElement } = ide_core_common_1.arrays;
let ResourceServiceImpl = class ResourceServiceImpl extends ide_core_browser_1.WithEventBus {
    constructor() {
        super();
        this.providers = [];
        this.resources = new Map();
        this.gettingResources = new Map();
        this.resourceDecoration = new Map();
        this.cachedProvider = new ide_core_common_1.LRUMap(500, 200);
        this.onRegisterResourceProviderEmitter = new ide_core_common_1.Emitter();
        this.onRegisterResourceProvider = this.onRegisterResourceProviderEmitter.event;
        this.onUnregisterResourceProviderEmitter = new ide_core_common_1.Emitter();
        this.onUnregisterResourceProvider = this.onUnregisterResourceProviderEmitter.event;
    }
    onResourceNeedUpdateEvent(e) {
        const uri = e.payload;
        if (this.resources.has(uri.toString())) {
            const resource = this.resources.get(uri.toString());
            this.doGetResource(uri).then((newResource) => {
                if (resource) {
                    Object.assign(resource === null || resource === void 0 ? void 0 : resource.resource, newResource === null || newResource === void 0 ? void 0 : newResource.resource);
                    resource.provider = newResource === null || newResource === void 0 ? void 0 : newResource.provider;
                }
                this.eventBus.fire(new common_1.ResourceDidUpdateEvent(uri));
            });
        }
    }
    onResourceDecorationChangeEvent(e) {
        this.getResourceDecoration(e.payload.uri); // ensure object
        let changed = false;
        const previous = this.resourceDecoration.get(e.payload.uri.toString()) || {};
        new Set([...Object.keys(previous), ...Object.keys(e.payload.decoration)]).forEach((key) => {
            if (previous[key] !== e.payload.decoration[key]) {
                changed = true;
            }
        });
        if (changed) {
            Object.assign(this.resourceDecoration.get(e.payload.uri.toString()), e.payload.decoration);
            this.eventBus.fire(new common_1.ResourceDecorationChangeEvent(e.payload));
        }
    }
    getSupportedSchemes() {
        return Array.from(this.providers.values())
            .map((provider) => provider.scheme)
            .filter(Boolean);
    }
    async getResource(uri) {
        if (!this.resources.has(uri.toString())) {
            const r = await this.doGetResource(uri);
            if (!r) {
                return null;
            }
            const resource = {
                resource: (0, mobx_1.observable)(Object.assign({}, r.resource)),
                provider: r.provider,
            };
            this.resources.set(uri.toString(), resource);
        }
        return this.resources.get(uri.toString()).resource;
    }
    handlesUri(uri) {
        const provider = this.calculateProvider(uri);
        return !!provider;
    }
    async doGetResource(uri) {
        if (!this.gettingResources.has(uri.toString())) {
            const promise = (async () => {
                const provider = this.calculateProvider(uri);
                if (!provider) {
                    this.logger.error('URI has no resource provider: ' + uri);
                    return null;
                }
                else {
                    const r = await provider.provideResource(uri);
                    r.uri = uri;
                    return {
                        resource: r,
                        provider,
                    };
                }
            })();
            this.gettingResources.set(uri.toString(), promise);
            promise.finally(() => {
                this.gettingResources.delete(uri.toString());
            });
        }
        return this.gettingResources.get(uri.toString());
    }
    registerResourceProvider(provider) {
        this.onRegisterResourceProviderEmitter.fire(provider);
        const disposer = new ide_core_common_1.Disposable();
        disposer.addDispose(addElement(this.providers, provider));
        disposer.addDispose({
            dispose: () => {
                for (const r of this.resources.values()) {
                    if (r.provider === provider) {
                        r.provider = GhostResourceProvider;
                        this.onUnregisterResourceProviderEmitter.fire(provider);
                    }
                }
                this.cachedProvider.clear();
            },
        });
        this.cachedProvider.clear();
        return disposer;
    }
    async shouldCloseResource(resource, openedResources) {
        const provider = this.getProvider(resource.uri);
        if (!provider || !provider.shouldCloseResource) {
            return true;
        }
        else {
            return await provider.shouldCloseResource(resource, openedResources);
        }
    }
    async shouldCloseResourceWithoutConfirm(resource) {
        const provider = this.getProvider(resource.uri);
        if (provider && provider.shouldCloseResourceWithoutConfirm) {
            return await provider.shouldCloseResourceWithoutConfirm(resource);
        }
        return false;
    }
    async close(resource, saveAction) {
        const provider = this.getProvider(resource.uri);
        if (!provider || !provider.close) {
            return true;
        }
        else {
            return await provider.close(resource, saveAction);
        }
    }
    calculateProvider(uri) {
        if (this.cachedProvider.has(uri.toString())) {
            return this.cachedProvider.get(uri.toString());
        }
        let currentProvider;
        let currentComparator = {
            weight: -1,
            index: -1,
        };
        function acceptProvider(provider, weight, index) {
            currentComparator = { weight, index };
            currentProvider = provider;
        }
        this.providers.forEach((provider, index) => {
            let weight = -1;
            if (provider.handlesUri) {
                weight = provider.handlesUri(uri);
            }
            else if (provider.scheme) {
                weight = provider.scheme === uri.scheme ? 10 : -1;
            }
            if (weight >= 0) {
                if (weight > currentComparator.weight) {
                    acceptProvider(provider, weight, index);
                }
                else if (weight === currentComparator.weight && index > currentComparator.index) {
                    acceptProvider(provider, weight, index);
                }
            }
        });
        this.cachedProvider.set(uri.toString(), currentProvider);
        return currentProvider;
    }
    getProvider(uri) {
        const r = this.resources.get(uri.toString());
        if (r) {
            return r.provider;
        }
        else {
            return undefined;
        }
    }
    getResourceDecoration(uri) {
        if (!this.resourceDecoration.has(uri.toString())) {
            this.resourceDecoration.set(uri.toString(), (0, mobx_1.observable)(DefaultResourceDecoration));
        }
        return this.resourceDecoration.get(uri.toString());
    }
    getResourceSubname(resource, groupResources) {
        const provider = this.getProvider(resource.uri);
        if (!provider) {
            return null; // no provider
        }
        else if (!provider.provideResourceSubname) {
            return null;
        }
        else {
            return provider.provideResourceSubname(resource, groupResources);
        }
    }
    disposeResource(resource) {
        const provider = this.getProvider(resource.uri);
        this.resources.delete(resource.uri.toString());
        this.resourceDecoration.delete(resource.uri.toString());
        if (!provider || !provider.onDisposeResource) {
            return;
        }
        else {
            return provider.onDisposeResource(resource);
        }
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_common_1.ILogger),
    tslib_1.__metadata("design:type", Object)
], ResourceServiceImpl.prototype, "logger", void 0);
tslib_1.__decorate([
    (0, ide_core_browser_1.OnEvent)(common_1.ResourceNeedUpdateEvent),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [common_1.ResourceNeedUpdateEvent]),
    tslib_1.__metadata("design:returntype", void 0)
], ResourceServiceImpl.prototype, "onResourceNeedUpdateEvent", null);
tslib_1.__decorate([
    (0, ide_core_browser_1.OnEvent)(common_1.ResourceDecorationNeedChangeEvent),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [common_1.ResourceDecorationNeedChangeEvent]),
    tslib_1.__metadata("design:returntype", void 0)
], ResourceServiceImpl.prototype, "onResourceDecorationChangeEvent", null);
ResourceServiceImpl = tslib_1.__decorate([
    (0, di_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [])
], ResourceServiceImpl);
exports.ResourceServiceImpl = ResourceServiceImpl;
const DefaultResourceDecoration = {
    dirty: false,
    readOnly: false,
};
const GhostResourceProvider = {
    handlesUri: () => -1,
    provideResource: (uri) => ({ uri, name: '', icon: '' }),
};
//# sourceMappingURL=resource.service.js.map