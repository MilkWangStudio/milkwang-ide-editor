"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorDocumentModelContentRegistryImpl = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const types_1 = require("./types");
let EditorDocumentModelContentRegistryImpl = class EditorDocumentModelContentRegistryImpl {
    constructor() {
        this.providers = [];
        this._onOriginalDocChanged = new ide_core_browser_1.Emitter();
        this.cachedProviders = new ide_core_browser_1.LRUMap(1000, 500);
        this.originalProvider = {
            handlesScheme: (scheme) => scheme === types_1.ORIGINAL_DOC_SCHEME,
            provideEditorDocumentModelContent: async (uri) => {
                const { target } = uri.getParsedQuery();
                const targetUri = new ide_core_browser_1.URI(target);
                return (await this.getContentForUri(targetUri)) || '';
            },
            isReadonly: () => true,
            onDidChangeContent: this._onOriginalDocChanged.event,
        };
        this.registerEditorDocumentModelContentProvider(this.originalProvider);
    }
    registerEditorDocumentModelContentProvider(provider) {
        this.providers.push(provider);
        this.cachedProviders.clear();
        const disposer = provider.onDidChangeContent((uri) => {
            this.eventBus.fire(new types_1.EditorDocumentModelOptionExternalUpdatedEvent(uri));
        });
        // 每次注册 doc content provider， 都同时注册一个用于取出原始文档内容的doc provider
        // 处理的doc uri为shadowed_前缀的scheme
        if (provider !== this.originalProvider && provider.onDidChangeContent) {
            provider.onDidChangeContent((uri) => {
                this._onOriginalDocChanged.fire(ide_core_browser_1.URI.from({
                    scheme: types_1.ORIGINAL_DOC_SCHEME,
                    query: ide_core_browser_1.URI.stringifyQuery({
                        target: uri.toString(),
                    }),
                }));
            });
        }
        return {
            dispose: () => {
                disposer.dispose();
                const index = this.providers.indexOf(provider);
                if (index) {
                    this.providers.splice(index, 1);
                    this.cachedProviders.clear();
                }
            },
        };
    }
    getProvider(uri) {
        const uriStr = uri.toString();
        if (!this.cachedProviders.has(uriStr)) {
            this.cachedProviders.set(uriStr, this.calculateProvider(uri));
        }
        return this.cachedProviders.get(uriStr);
    }
    // Ant Codespaces 需要使用该方法复写 getProvider，不使用缓存 provider
    async calculateProvider(uri) {
        let calculated = {
            provider: undefined,
            weight: -1,
            index: 1,
        };
        for (const provider of this.providers) {
            let weight = -1;
            const index = this.providers.indexOf(provider);
            if (provider.handlesUri) {
                weight = await provider.handlesUri(uri);
            }
            else if (provider.handlesScheme) {
                weight = (await provider.handlesScheme(uri.scheme)) ? 10 : -1;
            }
            if (weight >= 0) {
                if (weight > calculated.weight || (weight === calculated.weight && index > calculated.index)) {
                    calculated = {
                        index,
                        weight,
                        provider,
                    };
                }
            }
        }
        return calculated.provider;
    }
    async getContentForUri(uri, encoding) {
        const p = await this.getProvider(uri);
        if (!p) {
            throw new Error();
        }
        return p.provideEditorDocumentModelContent(uri, encoding);
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.IEventBus),
    tslib_1.__metadata("design:type", Object)
], EditorDocumentModelContentRegistryImpl.prototype, "eventBus", void 0);
EditorDocumentModelContentRegistryImpl = tslib_1.__decorate([
    (0, di_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [])
], EditorDocumentModelContentRegistryImpl);
exports.EditorDocumentModelContentRegistryImpl = EditorDocumentModelContentRegistryImpl;
//# sourceMappingURL=editor-document-registry.js.map