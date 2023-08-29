"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorComponentRegistryImpl = void 0;
const tslib_1 = require("tslib");
const isEqual_1 = tslib_1.__importDefault(require("lodash/isEqual"));
const uniqWith_1 = tslib_1.__importDefault(require("lodash/uniqWith"));
const react_dom_1 = tslib_1.__importDefault(require("react-dom"));
const di_1 = require("@opensumi/di");
const ide_core_common_1 = require("@opensumi/ide-core-common");
const types_1 = require("./types");
let EditorComponentRegistryImpl = class EditorComponentRegistryImpl {
    constructor() {
        this.components = new Map();
        this.sideWidgets = {
            bottom: new Set(),
            top: new Set(),
        };
        this.initialPropsMap = new Map();
        this.resolvers = new Map();
        this.normalizedResolvers = [];
        this.perWorkbenchComponents = {};
    }
    registerEditorComponent(component, initialProps) {
        const uid = component.uid;
        if (!component.renderMode) {
            component.renderMode = types_1.EditorComponentRenderMode.ONE_PER_GROUP;
        }
        this.components.set(uid, component);
        this.initialPropsMap.set(uid, initialProps);
        // 使用 activationEvent 通知插件
        this.eventBus.fire(new ide_core_common_1.ExtensionActivateEvent({ topic: 'onRegisterEditorComponent', data: uid }));
        this.eventBus.fire(new types_1.RegisterEditorComponentEvent(uid));
        return {
            dispose: () => {
                if (this.components.get(uid) === component) {
                    this.components.delete(uid);
                    this.eventBus.fire(new types_1.EditorComponentDisposeEvent(component));
                }
            },
        };
    }
    registerEditorComponentResolver(scheme, resolver) {
        let normalizedResolver;
        if (typeof scheme === 'function') {
            normalizedResolver = {
                handleScheme: scheme,
                resolver,
            };
        }
        else {
            normalizedResolver = {
                handleScheme: (s) => (s === scheme ? 10 : -1),
                resolver,
            };
        }
        this.normalizedResolvers.push(normalizedResolver);
        // 注册了新的，清除缓存
        this.resolvers.clear();
        return {
            dispose: () => {
                // 去除已被 cache 的resolver
                for (const resolvers of this.resolvers.values()) {
                    const index = resolvers.indexOf(resolver);
                    if (index !== -1) {
                        resolvers.splice(index, 1);
                    }
                }
                const i = this.normalizedResolvers.indexOf(normalizedResolver);
                if (i !== -1) {
                    this.normalizedResolvers.splice(i, 1);
                }
            },
        };
    }
    async resolveEditorComponent(resource) {
        let results = [];
        const resolvers = this.getResolvers(resource.uri.scheme).slice(); // 防止异步操作时数组被改变
        let shouldBreak = false;
        const resolve = (res) => {
            results = res;
            shouldBreak = true;
        };
        for (const resolver of resolvers) {
            await resolver(resource, results, resolve);
            if (shouldBreak) {
                break;
            }
        }
        results.sort((a, b) => {
            const wa = a.weight || 0;
            const wb = b.weight || 0;
            return wb - wa;
        });
        return (0, uniqWith_1.default)(results, isEqual_1.default);
    }
    calculateSchemeResolver(scheme) {
        const resolvers = this.normalizedResolvers.slice();
        const calculated = [];
        resolvers.forEach((r, index) => {
            const weight = r.handleScheme(scheme);
            if (weight >= 0) {
                calculated.push({
                    weight,
                    index,
                    resolver: r.resolver,
                });
            }
        });
        return calculated
            .sort((a, b) => {
            if (a.weight > b.weight) {
                return -1;
            }
            else if (a.weight < b.weight) {
                return 1;
            }
            else {
                return b.index - a.index;
            }
        })
            .map((c) => c.resolver);
    }
    getResolvers(scheme) {
        if (!this.resolvers.has(scheme)) {
            this.resolvers.set(scheme, this.calculateSchemeResolver(scheme));
        }
        return this.resolvers.get(scheme);
    }
    getEditorComponent(id) {
        return this.components.get(id) || null;
    }
    getEditorInitialProps(id) {
        return this.initialPropsMap.get(id) || null;
    }
    clearPerWorkbenchComponentCache(componentId) {
        react_dom_1.default.unmountComponentAtNode(this.perWorkbenchComponents[componentId]);
        delete this.perWorkbenchComponents[componentId];
    }
    getSideWidgets(side, resource) {
        const res = [];
        this.sideWidgets[side].forEach((widget) => {
            if (widget.displaysOnResource(resource)) {
                res.push(widget);
            }
        });
        return res.sort((w1, w2) => {
            const weight1 = w1.weight === undefined ? 10 : w1.weight;
            const weight2 = w2.weight === undefined ? 10 : w2.weight;
            return weight2 - weight1;
        });
    }
    registerEditorSideWidget(widget) {
        const side = widget.side || 'bottom';
        this.sideWidgets[side].add(widget);
        this.eventBus.fire(new types_1.RegisterEditorSideComponentEvent());
        return {
            dispose: () => {
                this.sideWidgets[side].delete(widget);
            },
        };
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_common_1.IEventBus),
    tslib_1.__metadata("design:type", Object)
], EditorComponentRegistryImpl.prototype, "eventBus", void 0);
EditorComponentRegistryImpl = tslib_1.__decorate([
    (0, di_1.Injectable)()
], EditorComponentRegistryImpl);
exports.EditorComponentRegistryImpl = EditorComponentRegistryImpl;
//# sourceMappingURL=component.js.map