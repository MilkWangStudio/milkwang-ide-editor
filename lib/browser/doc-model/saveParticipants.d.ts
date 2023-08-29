import { ClientAppContribution, WithEventBus } from '@opensumi/ide-core-browser';
import { EditorDocumentModelWillSaveEvent } from './types';
export declare class CodeActionOnSaveParticipant extends WithEventBus {
    private readonly preferenceService;
    private readonly overrideServiceRegistry;
    private readonly commandService;
    private readonly docService;
    private readonly logger;
    private readonly progressService;
    get bulkEditService(): any;
    activate(): void;
    onEditorDocumentModelWillSave(e: EditorDocumentModelWillSaveEvent): Promise<void>;
    private applyOnSaveActions;
    private applyCodeActions;
    private getActionsToRun;
}
export declare class TrimFinalNewLinesParticipant extends WithEventBus {
    private readonly preferenceService;
    private readonly docService;
    private readonly logger;
    private readonly injector;
    activate(): void;
    onEditorDocumentModelWillSave(e: EditorDocumentModelWillSaveEvent): Promise<void>;
    /**
     * returns 0 if the entire file is empty
     */
    private findLastNonEmptyLine;
    private doTrimFinalNewLines;
}
export declare class SaveParticipantsContribution implements ClientAppContribution {
    codeActionOnSaveParticipant: CodeActionOnSaveParticipant;
    trimFinalNewLinesParticipant: TrimFinalNewLinesParticipant;
    onStart(): void;
}
//# sourceMappingURL=saveParticipants.d.ts.map