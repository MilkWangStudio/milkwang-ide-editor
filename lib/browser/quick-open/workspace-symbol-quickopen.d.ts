/// <reference types="vscode" />
import type { SymbolInformation } from 'vscode-languageserver-types';
import { QuickOpenHandler, QuickOpenModel, QuickOpenItem, CancellationToken, URI, QuickOpenMode } from '@opensumi/ide-core-browser';
import { IReporterService } from '@opensumi/ide-core-common';
import { WorkspaceSymbolProvider, WorkbenchEditorService } from '../../common';
export declare class WorkspaceSymbolQuickOpenHandler implements QuickOpenHandler {
    private readonly languageService;
    private readonly workspaceService;
    private readonly logger;
    private readonly workbenchEditorService;
    private readonly workspaceSymbolActionProvider;
    reporterService: IReporterService;
    prefix: string;
    get description(): string;
    private cancellationSource;
    getModel(): QuickOpenModel;
    getOptions(): {
        fuzzyMatchLabel: {
            enableSeparateSubstringMatching: boolean;
        };
        showItemsWithoutHighlight: boolean;
        fuzzyMatchDescription: boolean;
        getPlaceholderItem: (lookFor: string, originLookFor: string) => QuickOpenItem;
    };
    onClose(): void;
    onToggle(): void;
}
export declare class SymbolInformationQuickOpenItem extends QuickOpenItem {
    protected readonly symbol: SymbolInformation;
    private readonly provider;
    private readonly workbenchEditorService;
    private readonly token;
    private relativePath;
    constructor(symbol: SymbolInformation, provider: WorkspaceSymbolProvider, workbenchEditorService: WorkbenchEditorService, token: CancellationToken, relativePath: string);
    getLabel(): string;
    getUri(): URI;
    getIconClass(): string;
    getDescription(): string;
    private fromRange;
    private open;
    run(mode: QuickOpenMode): boolean;
    openSide(): Thenable<void>;
}
//# sourceMappingURL=workspace-symbol-quickopen.d.ts.map