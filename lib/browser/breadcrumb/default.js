"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findCurrentDocumentSymbol = exports.DefaultBreadCrumbProvider = void 0;
const tslib_1 = require("tslib");
const debounce_1 = tslib_1.__importDefault(require("lodash/debounce"));
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const services_1 = require("@opensumi/ide-core-browser/lib/services");
const file_service_client_1 = require("@opensumi/ide-file-service/lib/common/file-service-client");
const workspace_interface_1 = require("@opensumi/ide-workspace/lib/common/workspace.interface");
const types_1 = require("../types");
const document_symbol_1 = require("./document-symbol");
const { Path } = ide_core_browser_1.path;
let DefaultBreadCrumbProvider = class DefaultBreadCrumbProvider extends ide_core_browser_1.WithEventBus {
    constructor() {
        super(...arguments);
        this._onDidUpdateBreadCrumb = new ide_core_browser_1.Emitter();
        this.onDidUpdateBreadCrumb = this._onDidUpdateBreadCrumb.event;
        this.debouncedFireUriEvent = new Map();
        this.cachedBreadCrumb = new ide_core_browser_1.LRUMap(200, 100);
    }
    handlesUri(uri) {
        return this.fileServiceClient.handlesScheme(uri.scheme);
    }
    provideBreadCrumbForUri(uri, editor) {
        return this.getFileParts(uri).concat(this.getDocumentSymbolParts(uri, editor));
    }
    getFileParts(uri) {
        const workspaceRoot = this.workspaceService.workspace
            ? new ide_core_browser_1.URI(this.workspaceService.workspace.uri)
            : undefined;
        let root;
        let relativePaths;
        if (workspaceRoot && workspaceRoot.isEqualOrParent(uri)) {
            root = workspaceRoot;
            relativePaths = workspaceRoot.relative(uri);
        }
        else {
            root = ide_core_browser_1.URI.from({
                scheme: uri.scheme,
                authority: uri.authority,
            });
            relativePaths = uri.path;
        }
        let p = root.path;
        const result = [];
        for (const r of relativePaths
            .toString()
            .split(Path.separator)
            .filter((p) => !!p)) {
            p = p.join(r);
            const u = root.withPath(p);
            result.push(this.createFilePartBreadCrumbUri(u, !u.isEqual(uri)));
        }
        return result;
    }
    createFilePartBreadCrumbUri(uri, isDirectory) {
        const uriString = uri.toString();
        if (this.cachedBreadCrumb.has(uriString)) {
            return this.cachedBreadCrumb.get(uriString);
        }
        const res = {
            name: uri.path.base,
            uri,
            icon: this.labelService.getIcon(uri, { isDirectory }),
            getSiblings: async () => {
                const parentDir = ide_core_browser_1.URI.from({
                    scheme: uri.scheme,
                }).withPath(uri.path.dir);
                const stat = await this.fileServiceClient.getFileStat(parentDir.toString());
                const parts = [];
                let currentIndex = -1;
                if (stat && stat.children && stat.children.length > 0) {
                    sortByNumeric(stat.children).forEach((file, i) => {
                        parts.push(this.createFilePartBreadCrumbUri(new ide_core_browser_1.URI(file.uri), file.isDirectory));
                        if (currentIndex === -1 && uri.toString() === file.uri) {
                            currentIndex = i;
                        }
                    });
                }
                return {
                    parts,
                    currentIndex,
                };
            },
        };
        if (isDirectory) {
            res.getChildren = async () => {
                const stat = await this.fileServiceClient.getFileStat(uri.toString());
                const parts = [];
                if (stat && stat.children && stat.children.length > 0) {
                    sortByNumeric(stat.children).forEach((file, i) => {
                        parts.push(this.createFilePartBreadCrumbUri(new ide_core_browser_1.URI(file.uri), file.isDirectory));
                    });
                }
                return parts;
            };
        }
        else {
            res.onClick = () => {
                this.commandService.executeCommand(ide_core_browser_1.EDITOR_COMMANDS.OPEN_RESOURCE.id, uri);
            };
        }
        this.cachedBreadCrumb.set(uriString, res);
        return res;
    }
    getDocumentSymbolParts(uri, editor) {
        if (!editor) {
            return [];
        }
        const symbols = this.documentSymbolStore.getDocumentSymbol(uri);
        if (symbols && symbols.length > 0) {
            const currentSymbols = findCurrentDocumentSymbol(symbols, editor.monacoEditor.getPosition());
            if (currentSymbols.length > 0) {
                return currentSymbols.map((symbol) => this.createFromDocumentSymbol(symbol, editor));
            }
            else {
                return [
                    {
                        name: '...',
                        getSiblings: () => ({
                            parts: symbols
                                .sort((a, b) => sortByRangeStart(a.range, b.range))
                                .map((symbol) => this.createFromDocumentSymbol(symbol, editor)),
                            currentIndex: -1,
                        }),
                    },
                ];
            }
        }
        else {
            return [];
        }
    }
    createFromDocumentSymbol(symbol, editor) {
        const res = {
            name: symbol.name,
            icon: (0, ide_core_browser_1.getSymbolIcon)(symbol.kind),
            isSymbol: true,
            onClick: () => {
                editor.setSelection({
                    startColumn: symbol.range.startColumn,
                    endColumn: symbol.range.startColumn,
                    startLineNumber: symbol.range.startLineNumber,
                    endLineNumber: symbol.range.startLineNumber,
                });
                editor.monacoEditor.revealRangeInCenter(symbol.range);
                editor.monacoEditor.focus();
            },
        };
        if (symbol.parent) {
            res.getSiblings = () => ({
                parts: symbol
                    .parent.children.sort((a, b) => sortByRangeStart(a.range, b.range))
                    .map((symbol) => this.createFromDocumentSymbol(symbol, editor)),
                currentIndex: symbol.parent.children.indexOf(symbol),
            });
        }
        if (symbol.children && symbol.children.length > 0) {
            res.getChildren = () => symbol
                .children.sort((a, b) => sortByRangeStart(a.range, b.range))
                .map((symbol) => this.createFromDocumentSymbol(symbol, editor));
        }
        return res;
    }
    onDocumentSymbolChangedEvent(e) {
        this.notifyUpdate(e.payload);
    }
    onEditorSelectionChangeEvent(e) {
        this.notifyUpdate(e.payload.editorUri);
    }
    notifyUpdate(uri) {
        if (!this.debouncedFireUriEvent.has(uri.toString())) {
            this.debouncedFireUriEvent.set(uri.toString(), (0, debounce_1.default)(() => {
                this._onDidUpdateBreadCrumb.fire(uri);
            }, 100, { maxWait: 1000 }));
        }
        this.debouncedFireUriEvent.get(uri.toString())();
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(file_service_client_1.IFileServiceClient),
    tslib_1.__metadata("design:type", Object)
], DefaultBreadCrumbProvider.prototype, "fileServiceClient", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(workspace_interface_1.IWorkspaceService),
    tslib_1.__metadata("design:type", Object)
], DefaultBreadCrumbProvider.prototype, "workspaceService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(services_1.LabelService),
    tslib_1.__metadata("design:type", services_1.LabelService)
], DefaultBreadCrumbProvider.prototype, "labelService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.CommandService),
    tslib_1.__metadata("design:type", Object)
], DefaultBreadCrumbProvider.prototype, "commandService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(),
    tslib_1.__metadata("design:type", document_symbol_1.DocumentSymbolStore)
], DefaultBreadCrumbProvider.prototype, "documentSymbolStore", void 0);
tslib_1.__decorate([
    (0, ide_core_browser_1.OnEvent)(document_symbol_1.DocumentSymbolChangedEvent),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [document_symbol_1.DocumentSymbolChangedEvent]),
    tslib_1.__metadata("design:returntype", void 0)
], DefaultBreadCrumbProvider.prototype, "onDocumentSymbolChangedEvent", null);
tslib_1.__decorate([
    (0, ide_core_browser_1.OnEvent)(types_1.EditorSelectionChangeEvent),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [types_1.EditorSelectionChangeEvent]),
    tslib_1.__metadata("design:returntype", void 0)
], DefaultBreadCrumbProvider.prototype, "onEditorSelectionChangeEvent", null);
DefaultBreadCrumbProvider = tslib_1.__decorate([
    (0, di_1.Injectable)()
], DefaultBreadCrumbProvider);
exports.DefaultBreadCrumbProvider = DefaultBreadCrumbProvider;
function findCurrentDocumentSymbol(documentSymbols, position) {
    const result = [];
    if (!position) {
        return result;
    }
    let toFindIn = documentSymbols;
    while (toFindIn && toFindIn.length > 0) {
        let found = false;
        for (const documentSymbol of toFindIn) {
            if (positionInRange(position, documentSymbol.range)) {
                result.push(documentSymbol);
                toFindIn = documentSymbol.children;
                found = true;
                break;
            }
        }
        if (!found) {
            break;
        }
    }
    return result;
}
exports.findCurrentDocumentSymbol = findCurrentDocumentSymbol;
function sortByNumeric(files) {
    return files.sort((a, b) => {
        if ((a.isDirectory && b.isDirectory) || (!a.isDirectory && !b.isDirectory)) {
            // numeric 参数确保数字为第一排序优先级
            const nameA = new ide_core_browser_1.URI(a.uri).path.name;
            const nameB = new ide_core_browser_1.URI(b.uri).path.name;
            return nameA.localeCompare(nameB, 'kn', { numeric: true });
        }
        else if (a.isDirectory && !b.isDirectory) {
            return -1;
        }
        else if (!a.isDirectory && b.isDirectory) {
            return 1;
        }
        else {
            return 0;
        }
    });
}
function positionInRange(pos, range) {
    if (pos.lineNumber < range.startLineNumber) {
        return false;
    }
    else if (pos.lineNumber === range.startLineNumber) {
        return pos.column >= range.startColumn;
    }
    else if (pos.lineNumber < range.endLineNumber) {
        return true;
    }
    else if (pos.lineNumber === range.endLineNumber) {
        return pos.column <= range.endColumn;
    }
    else {
        return false;
    }
}
function sortByRangeStart(rangeA, rangeB) {
    if (rangeA.startLineNumber > rangeB.startLineNumber) {
        return 1;
    }
    else if (rangeA.startLineNumber < rangeB.startLineNumber) {
        return -1;
    }
    else {
        if (rangeA.startColumn === rangeB.startColumn) {
            return 0;
        }
        return rangeA.startColumn > rangeB.startColumn ? 1 : -1;
    }
}
//# sourceMappingURL=default.js.map