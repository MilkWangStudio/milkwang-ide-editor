import { CommandContribution, CommandRegistry, IContextKeyService } from '@opensumi/ide-core-browser';
import { ICallHierarchyService } from '@opensumi/ide-monaco/lib/browser/contrib/callHierarchy';
import { BrowserEditorContribution, IEditorFeatureRegistry } from '../../types';
export declare const executePrepareCallHierarchyCommand: {
    id: string;
};
export declare const executeProvideIncomingCallsCommand: {
    id: string;
};
export declare const executeProvideOutgoingCallsCommand: {
    id: string;
};
export declare class CallHierarchyContribution implements CommandContribution, BrowserEditorContribution {
    private ctxHasProvider;
    protected readonly contextKeyService: IContextKeyService;
    protected readonly callHierarchyService: ICallHierarchyService;
    registerCommands(commands: CommandRegistry): void;
    registerEditorFeature(registry: IEditorFeatureRegistry): void;
}
//# sourceMappingURL=callHierarchy.contribution.d.ts.map