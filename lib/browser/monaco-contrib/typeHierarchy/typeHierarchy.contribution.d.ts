import { CommandContribution, CommandRegistry, IContextKeyService } from '@opensumi/ide-core-browser';
import { ITypeHierarchyService } from '@opensumi/ide-monaco/lib/browser/contrib/typeHierarchy';
import { BrowserEditorContribution, IEditorFeatureRegistry } from '../../types';
export declare const executePrepareTypeHierarchyCommand: {
    id: string;
};
export declare const executeProvideSupertypesCommand: {
    id: string;
};
export declare const executeProvideSubtypesCommand: {
    id: string;
};
export declare class TypeHierarchyContribution implements CommandContribution, BrowserEditorContribution {
    private ctxHasProvider;
    protected readonly contextKeyService: IContextKeyService;
    protected readonly typeHierarchyService: ITypeHierarchyService;
    registerCommands(commands: CommandRegistry): void;
    registerEditorFeature(registry: IEditorFeatureRegistry): void;
}
//# sourceMappingURL=typeHierarchy.contribution.d.ts.map