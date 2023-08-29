"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbolTag = exports.DocumentSymbolChangedEvent = exports.DocumentSymbolStore = void 0;
const tslib_1 = require("tslib");
const debounce_1 = tslib_1.__importDefault(require("lodash/debounce"));
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const languages_1 = require("@opensumi/ide-monaco/lib/browser/monaco-api/languages");
const languages_2 = require("@opensumi/monaco-editor-core/esm/vs/editor/common/languages");
Object.defineProperty(exports, "SymbolTag", { enumerable: true, get: function () { return languages_2.SymbolTag; } });
const common_1 = require("../../common");
const types_1 = require("../doc-model/types");
let DocumentSymbolStore = class DocumentSymbolStore extends ide_core_browser_1.WithEventBus {
    constructor() {
        super();
        this.documentSymbols = new Map();
        this.pendingUpdate = new Set();
        this.debounced = new Map();
        this.symbolDeferred = new Map();
        this.addDispose(languages_1.languageFeaturesService.documentSymbolProvider.onDidChange(() => {
            Array.from(this.documentSymbols.keys()).forEach((uriString) => {
                this.markNeedUpdate(new ide_core_browser_1.URI(uriString));
            });
        }));
    }
    getDocumentSymbol(uri) {
        if (!this.documentSymbols.has(uri.toString())) {
            this.documentSymbols.set(uri.toString(), undefined);
            this.createDocumentSymbolCache(uri);
        }
        if (this.pendingUpdate.has(uri.toString())) {
            this.updateDocumentSymbolCache(uri);
        }
        return this.documentSymbols.get(uri.toString());
    }
    /**
     * 等待获取文件 symbol，否则文件搜索一个未打开过的文件 symbols 为空
     */
    async getDocumentSymbolAsync(uri, token) {
        var _a;
        const uriStr = uri.toString();
        if (token) {
            token.onCancellationRequested(() => {
                var _a;
                (_a = this.symbolDeferred.get(uriStr)) === null || _a === void 0 ? void 0 : _a.resolve();
                this.symbolDeferred.delete(uriStr);
            });
        }
        if ((!this.documentSymbols.has(uriStr) || this.pendingUpdate.has(uriStr)) && !this.symbolDeferred.has(uriStr)) {
            this.symbolDeferred.set(uriStr, new ide_core_browser_1.Deferred());
            this.updateDocumentSymbolCache(uri);
        }
        await ((_a = this.symbolDeferred.get(uriStr)) === null || _a === void 0 ? void 0 : _a.promise);
        return this.documentSymbols.get(uriStr);
    }
    async createDocumentSymbolCache(uri) {
        this.updateDocumentSymbolCache(uri);
    }
    async doUpdateDocumentSymbolCache(uri) {
        var _a, _b;
        this.pendingUpdate.delete(uri.toString());
        const modelRef = await this.editorDocumentModelRegistry.createModelReference(uri);
        if (!modelRef) {
            (_a = this.symbolDeferred.get(uri.toString())) === null || _a === void 0 ? void 0 : _a.resolve();
            return;
        }
        try {
            const supports = languages_1.languageFeaturesService.documentSymbolProvider.all(modelRef.instance.getMonacoModel());
            let result;
            for (const support of supports) {
                result = await support.provideDocumentSymbols(modelRef.instance.getMonacoModel(), new ide_core_browser_1.CancellationTokenSource().token);
                if (result) {
                    break;
                }
            }
            if (result) {
                normalizeDocumentSymbols(result, { children: result }, uri);
            }
            this.documentSymbols.set(uri.toString(), result);
            this.eventBus.fire(new DocumentSymbolChangedEvent(uri));
        }
        finally {
            modelRef.dispose();
        }
        (_b = this.symbolDeferred.get(uri.toString())) === null || _b === void 0 ? void 0 : _b.resolve();
    }
    updateDocumentSymbolCache(uri) {
        if (!this.debounced.has(uri.toString())) {
            this.debounced.set(uri.toString(), (0, debounce_1.default)(() => this.doUpdateDocumentSymbolCache(uri), 100, { maxWait: 1000 }));
        }
        this.debounced.get(uri.toString())();
    }
    onEditorDocumentModelContentChangedEvent(e) {
        if (e.payload.changes && e.payload.changes.length > 0) {
            this.markNeedUpdate(e.payload.uri);
        }
    }
    markNeedUpdate(uri) {
        this.pendingUpdate.add(uri.toString());
        if (this.isWatching(uri)) {
            this.updateDocumentSymbolCache(uri);
        }
    }
    isWatching(uri) {
        for (const g of this.editorService.editorGroups) {
            if (g.currentResource && g.currentResource.uri.isEqual(uri)) {
                return true;
            }
        }
        return false;
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(types_1.IEditorDocumentModelService),
    tslib_1.__metadata("design:type", Object)
], DocumentSymbolStore.prototype, "editorDocumentModelRegistry", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(common_1.WorkbenchEditorService),
    tslib_1.__metadata("design:type", common_1.WorkbenchEditorService)
], DocumentSymbolStore.prototype, "editorService", void 0);
tslib_1.__decorate([
    (0, ide_core_browser_1.OnEvent)(types_1.EditorDocumentModelContentChangedEvent),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [types_1.EditorDocumentModelContentChangedEvent]),
    tslib_1.__metadata("design:returntype", void 0)
], DocumentSymbolStore.prototype, "onEditorDocumentModelContentChangedEvent", null);
DocumentSymbolStore = tslib_1.__decorate([
    (0, di_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [])
], DocumentSymbolStore);
exports.DocumentSymbolStore = DocumentSymbolStore;
class DocumentSymbolChangedEvent extends ide_core_browser_1.BasicEvent {
}
exports.DocumentSymbolChangedEvent = DocumentSymbolChangedEvent;
function normalizeDocumentSymbols(documentSymbols, parent, uri) {
    documentSymbols.forEach((documentSymbol, index) => {
        const symbol = documentSymbol;
        symbol.parent = parent;
        symbol.id = getSymbolId(uri, symbol, index);
        if (documentSymbol.children && documentSymbol.children.length > 0) {
            normalizeDocumentSymbols(documentSymbol.children, documentSymbol, uri);
        }
    });
    return documentSymbols;
}
function getSymbolId(uri, symbol, index) {
    const symbolNameList = [symbol.name];
    while (symbol.parent) {
        const parent = symbol.parent;
        // dummyRoot
        if (!parent.name) {
            break;
        }
        symbolNameList.unshift(parent.name);
        symbol = parent;
    }
    return `${uri.toString()}__${symbolNameList.join('-')}__${index}`;
}
//# sourceMappingURL=document-symbol.js.map