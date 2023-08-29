import { IMenuRegistry, MenuContribution } from '@opensumi/ide-core-browser/lib/menu/next';
import { CommandContribution, CommandRegistry, Disposable } from '@opensumi/ide-core-common';
export declare class OpenTypeMenuContribution extends Disposable implements CommandContribution, MenuContribution {
    private readonly workbenchEditorService;
    private readonly menuRegistry;
    registerCommands(commands: CommandRegistry): void;
    constructor();
    registerEditorOpenTypes(): void;
    registerMenus(menuRegistry: IMenuRegistry): void;
    private registerMenuItem;
}
//# sourceMappingURL=open-type-menu.contribution.d.ts.map