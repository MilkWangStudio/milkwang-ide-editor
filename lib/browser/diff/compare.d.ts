import { URI, Deferred, CommandContribution, CommandRegistry } from '@opensumi/ide-core-browser';
import { MenuContribution, IMenuRegistry } from '@opensumi/ide-core-browser/lib/menu/next';
import { ICompareService, CompareResult } from '../types';
export declare class CompareService implements ICompareService {
    readonly comparing: Map<string, Deferred<CompareResult>>;
    private commandService;
    compare(original: URI, modified: URI, name: string): Promise<CompareResult>;
}
export declare class CompareEditorContribution implements MenuContribution, CommandContribution {
    compareService: CompareService;
    registerMenus(menu: IMenuRegistry): void;
    registerCommands(commands: CommandRegistry): void;
}
//# sourceMappingURL=compare.d.ts.map