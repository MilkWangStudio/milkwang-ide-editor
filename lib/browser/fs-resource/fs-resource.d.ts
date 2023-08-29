import { URI, WithEventBus, LRUMap, IApplicationService } from '@opensumi/ide-core-browser';
import { LabelService } from '@opensumi/ide-core-browser/lib/services';
import { IFileServiceClient, FileStat } from '@opensumi/ide-file-service/lib/common';
import { IDialogService } from '@opensumi/ide-overlay';
import { IResourceProvider, IResource, AskSaveResult } from '../../common';
import { IEditorDocumentModelService } from '../doc-model/types';
export declare class FileSystemResourceProvider extends WithEventBus implements IResourceProvider {
    private static SUBNAME_LIMIT;
    protected labelService: LabelService;
    protected fileServiceClient: IFileServiceClient;
    protected dialogService: IDialogService;
    protected documentModelService: IEditorDocumentModelService;
    protected applicationService: IApplicationService;
    cachedFileStat: LRUMap<string, FileStat | undefined>;
    private involvedFiles;
    private ready;
    private userhomePath;
    constructor();
    init(): Promise<void>;
    handlesUri(uri: URI): number;
    protected listen(): void;
    getFileStat(uri: string): Promise<FileStat | undefined>;
    private getCurrentUserHome;
    private getReadableTooltip;
    provideResource(uri: URI): Promise<IResource<any>>;
    provideResourceSubname(resource: IResource, groupResources: IResource[]): string | null;
    onDisposeResource(resource: any): void;
    shouldCloseResourceWithoutConfirm(resource: IResource): Promise<boolean>;
    close(resource: IResource, saveAction?: AskSaveResult): Promise<boolean>;
    shouldCloseResource(resource: IResource, openedResources: IResource[][]): Promise<boolean>;
}
//# sourceMappingURL=fs-resource.d.ts.map