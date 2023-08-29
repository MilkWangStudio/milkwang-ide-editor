import { WithEventBus } from '@opensumi/ide-core-browser';
import { IStatusBarService } from '@opensumi/ide-core-browser/lib/services';
import { WorkbenchEditorService, IEditor, CursorStatus, ILanguageService } from '../common';
export declare class EditorStatusBarService extends WithEventBus {
    statusBar: IStatusBarService;
    workbenchEditorService: WorkbenchEditorService;
    languageService: ILanguageService;
    setListener(): void;
    protected updateCursorStatus(cursorStatus: CursorStatus): void;
    protected updateLanguageStatus(editor: IEditor | null): void;
}
//# sourceMappingURL=editor.status-bar.service.d.ts.map