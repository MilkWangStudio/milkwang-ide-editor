"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbolInformationQuickOpenItem = exports.WorkspaceSymbolQuickOpenHandler = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const ide_core_common_1 = require("@opensumi/ide-core-common");
const ide_quick_open_1 = require("@opensumi/ide-quick-open");
const ide_workspace_1 = require("@opensumi/ide-workspace");
const languages_1 = require("@opensumi/monaco-editor-core/esm/vs/editor/common/languages");
const common_1 = require("../../common");
let WorkspaceSymbolOpenSideAction = class WorkspaceSymbolOpenSideAction extends ide_quick_open_1.QuickOpenBaseAction {
    constructor() {
        super({
            id: 'workspace-symbol:splitToRight',
            tooltip: (0, ide_core_common_1.localize)('quickOpen.openOnTheRightSide'),
            class: (0, ide_core_browser_1.getIcon)('embed'),
        });
    }
    async run(item) {
        await item.openSide();
    }
};
WorkspaceSymbolOpenSideAction = tslib_1.__decorate([
    (0, di_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [])
], WorkspaceSymbolOpenSideAction);
let WorkspaceSymbolActionProvider = class WorkspaceSymbolActionProvider {
    hasActions() {
        return true;
    }
    getActions() {
        return [this.workspaceSymbolOpenSideActionOpen];
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(),
    tslib_1.__metadata("design:type", WorkspaceSymbolOpenSideAction)
], WorkspaceSymbolActionProvider.prototype, "workspaceSymbolOpenSideActionOpen", void 0);
WorkspaceSymbolActionProvider = tslib_1.__decorate([
    (0, di_1.Injectable)()
], WorkspaceSymbolActionProvider);
let WorkspaceSymbolQuickOpenHandler = class WorkspaceSymbolQuickOpenHandler {
    constructor() {
        this.prefix = '#';
        this.cancellationSource = new ide_core_browser_1.CancellationTokenSource();
    }
    get description() {
        return (0, ide_core_common_1.localize)('editor.workspaceSymbol.description');
    }
    getModel() {
        return {
            onType: (lookFor, acceptor) => {
                if (lookFor === '') {
                    acceptor([
                        new ide_core_browser_1.QuickOpenItem({
                            label: (0, ide_core_common_1.localize)('editor.workspaceSymbol.search'),
                            run: () => false,
                        }),
                    ]);
                    return;
                }
                if (lookFor === '#') {
                    return void acceptor([
                        new ide_core_browser_1.QuickOpenItem({
                            label: (0, ide_core_common_1.localize)('editor.workspaceSymbolClass.search'),
                            run: () => false,
                        }),
                    ]);
                }
                if (this.languageService.workspaceSymbolProviders.length === 0) {
                    acceptor([
                        new ide_core_browser_1.QuickOpenItem({
                            label: (0, ide_core_common_1.localize)('editor.workspaceSymbol.notfound'),
                            run: () => false,
                        }),
                    ]);
                    return;
                }
                const isSearchClass = lookFor[0] === '#';
                const items = [];
                this.cancellationSource.cancel();
                const newCancellationSource = new ide_core_browser_1.CancellationTokenSource();
                this.cancellationSource = newCancellationSource;
                const param = {
                    query: isSearchClass ? lookFor.slice(1) : lookFor,
                };
                const timer = this.reporterService.time(ide_core_common_1.REPORT_NAME.QUICK_OPEN_MEASURE);
                Promise.all(this.languageService.workspaceSymbolProviders.map(async (provider) => {
                    let symbols = await provider.provideWorkspaceSymbols(param, newCancellationSource.token);
                    if (isSearchClass) {
                        symbols = symbols === null || symbols === void 0 ? void 0 : symbols.filter((symbol) => symbol.kind === languages_1.SymbolKind.Class);
                    }
                    if (symbols && symbols.length && !newCancellationSource.token.isCancellationRequested) {
                        const quickOpenItems = await Promise.all(symbols.map(async (symbol) => {
                            const relative = await this.workspaceService.asRelativePath(new ide_core_browser_1.URI(symbol.location.uri).parent);
                            return new SymbolInformationQuickOpenItem(symbol, provider, this.workbenchEditorService, newCancellationSource.token, (relative === null || relative === void 0 ? void 0 : relative.path) || '');
                        }));
                        items.push(...quickOpenItems);
                        acceptor(items, this.workspaceSymbolActionProvider);
                    }
                    return symbols;
                }))
                    .catch((e) => {
                    this.logger.log(e);
                })
                    .finally(() => {
                    if (!newCancellationSource.token.isCancellationRequested) {
                        // 无数据清空历史数据
                        if (!items.length) {
                            acceptor([]);
                        }
                        timer.timeEnd(isSearchClass ? 'class' : 'symbol', {
                            lookFor,
                            stat: {
                                symbol: items.length,
                            },
                        });
                    }
                });
            },
        };
    }
    getOptions() {
        return {
            fuzzyMatchLabel: {
                enableSeparateSubstringMatching: true,
            },
            showItemsWithoutHighlight: true,
            // 不搜索文件路径
            fuzzyMatchDescription: false,
            getPlaceholderItem: (lookFor, originLookFor) => new ide_core_browser_1.QuickOpenItem({
                label: (0, ide_core_common_1.localize)(originLookFor.startsWith('##') ? 'editor.workspaceSymbolClass.notfound' : 'editor.workspaceSymbol.notfound'),
                run: () => false,
            }),
        };
    }
    onClose() {
        this.cancellationSource.cancel();
    }
    onToggle() {
        this.cancellationSource.cancel();
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(common_1.ILanguageService),
    tslib_1.__metadata("design:type", Object)
], WorkspaceSymbolQuickOpenHandler.prototype, "languageService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_workspace_1.IWorkspaceService),
    tslib_1.__metadata("design:type", Object)
], WorkspaceSymbolQuickOpenHandler.prototype, "workspaceService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_common_1.ILogger),
    tslib_1.__metadata("design:type", Object)
], WorkspaceSymbolQuickOpenHandler.prototype, "logger", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(common_1.WorkbenchEditorService),
    tslib_1.__metadata("design:type", common_1.WorkbenchEditorService)
], WorkspaceSymbolQuickOpenHandler.prototype, "workbenchEditorService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(),
    tslib_1.__metadata("design:type", WorkspaceSymbolActionProvider)
], WorkspaceSymbolQuickOpenHandler.prototype, "workspaceSymbolActionProvider", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_common_1.IReporterService),
    tslib_1.__metadata("design:type", Object)
], WorkspaceSymbolQuickOpenHandler.prototype, "reporterService", void 0);
WorkspaceSymbolQuickOpenHandler = tslib_1.__decorate([
    (0, di_1.Injectable)()
], WorkspaceSymbolQuickOpenHandler);
exports.WorkspaceSymbolQuickOpenHandler = WorkspaceSymbolQuickOpenHandler;
class SymbolInformationQuickOpenItem extends ide_core_browser_1.QuickOpenItem {
    constructor(symbol, provider, workbenchEditorService, token, relativePath) {
        super({});
        this.symbol = symbol;
        this.provider = provider;
        this.workbenchEditorService = workbenchEditorService;
        this.token = token;
        this.relativePath = relativePath;
    }
    getLabel() {
        return this.symbol.name;
    }
    getUri() {
        return new ide_core_browser_1.URI(this.symbol.location.uri);
    }
    getIconClass() {
        return (0, ide_core_browser_1.getSymbolIcon)(this.symbol.kind);
    }
    getDescription() {
        const containerName = this.symbol.containerName;
        return `${containerName ? `${containerName} · ` : ''}${decodeURIComponent(this.relativePath)}`;
    }
    fromRange(range) {
        if (!range) {
            return undefined;
        }
        const { start, end } = range;
        return {
            startLineNumber: start.line + 1,
            startColumn: start.character + 1,
            endLineNumber: end.line + 1,
            endColumn: end.character + 1,
        };
    }
    open(uri, range) {
        this.workbenchEditorService.open(uri, {
            range: this.fromRange(range),
        });
    }
    run(mode) {
        const uri = this.getUri();
        if (mode === ide_core_browser_1.QuickOpenMode.OPEN) {
            this.provider.resolveWorkspaceSymbol(this.symbol, this.token).then((resolvedSymbol) => {
                if (resolvedSymbol) {
                    this.open(uri, resolvedSymbol.location.range);
                }
                else {
                    this.open(uri, this.symbol.location.range);
                }
            });
        }
        return true;
    }
    openSide() {
        const uri = this.getUri();
        return this.provider.resolveWorkspaceSymbol(this.symbol, this.token).then((resolvedSymbol) => {
            this.workbenchEditorService.open(uri, {
                preview: false,
                split: common_1.EditorGroupSplitAction.Right,
                range: this.fromRange(resolvedSymbol ? resolvedSymbol.location.range : this.symbol.location.range),
                focus: true,
            });
        });
    }
}
exports.SymbolInformationQuickOpenItem = SymbolInformationQuickOpenItem;
//# sourceMappingURL=workspace-symbol-quickopen.js.map