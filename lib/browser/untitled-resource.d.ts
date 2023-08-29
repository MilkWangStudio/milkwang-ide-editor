import { URI, Event, WithEventBus, IEditorDocumentChange, IEditorDocumentModelSaveResult, AppConfig, IApplicationService, PreferenceService } from '@opensumi/ide-core-browser';
import { EOL } from '@opensumi/ide-monaco/lib/browser/monaco-api/types';
import { IDialogService } from '@opensumi/ide-overlay';
import { AskSaveResult, IResource, IResourceProvider, WorkbenchEditorService } from '../common';
import { IEditorDocumentModelService, IEditorDocumentModelContentProvider } from './doc-model/types';
export declare class UntitledDocumentIdCounter {
    private _id;
    get id(): number;
}
export declare class UntitledSchemeDocumentProvider implements IEditorDocumentModelContentProvider {
    editorDocumentModelService: IEditorDocumentModelService;
    workbenchEditorService: WorkbenchEditorService;
    private readonly commandService;
    protected readonly appConfig: AppConfig;
    protected readonly applicationService: IApplicationService;
    private _onDidChangeContent;
    onDidChangeContent: Event<URI>;
    protected readonly preferenceService: PreferenceService;
    handlesScheme(scheme: string): boolean;
    provideEncoding(uri: URI): Promise<string>;
    provideEOL(uri: URI): Promise<EOL>;
    provideEditorDocumentModelContent(uri: URI, encoding?: string | undefined): Promise<string>;
    isReadonly(uri: URI): boolean;
    isAlwaysDirty(uri: URI): boolean;
    disposeEvenDirty(uri: URI): boolean;
    closeAutoSave(uri: URI): boolean;
    saveDocumentModel(uri: URI, content: string, baseContent: string, changes: IEditorDocumentChange[], encoding: string, ignoreDiff?: boolean): Promise<IEditorDocumentModelSaveResult>;
    onDidDisposeModel(): void;
}
export declare class UntitledSchemeResourceProvider extends WithEventBus implements IResourceProvider {
    readonly scheme: string;
    protected dialogService: IDialogService;
    protected documentModelService: IEditorDocumentModelService;
    provideResource(uri: URI): {
        name: string;
        uri: URI;
        icon: string;
        metadata: null;
    };
    shouldCloseResourceWithoutConfirm(resource: IResource): Promise<boolean>;
    close(resource: IResource, saveAction?: AskSaveResult): Promise<boolean>;
    shouldCloseResource(resource: IResource): Promise<boolean>;
}
//# sourceMappingURL=untitled-resource.d.ts.map