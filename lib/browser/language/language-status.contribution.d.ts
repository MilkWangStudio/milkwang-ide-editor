import { ClientAppContribution, WithEventBus } from '@opensumi/ide-core-browser';
import { IEditor } from '../../common';
export declare class LanguageStatusContribution extends WithEventBus implements ClientAppContribution {
    private readonly statusBar;
    private readonly workbenchEditorService;
    private readonly languageStatusService;
    initialize(): void;
    protected updateLanguageStatus(editor: IEditor | null): void;
    private getLanguageStatusText;
}
//# sourceMappingURL=language-status.contribution.d.ts.map