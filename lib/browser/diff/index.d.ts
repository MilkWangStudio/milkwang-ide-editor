import { URI, WithEventBus } from '@opensumi/ide-core-browser';
import { LabelService } from '@opensumi/ide-core-browser/lib/services';
import { IFileServiceClient } from '@opensumi/ide-file-service';
import { IResourceProvider, IDiffResource, ResourceService, ResourceDecorationChangeEvent } from '../../common';
import { BrowserEditorContribution, EditorComponentRegistry } from '../types';
export declare class DiffResourceProvider extends WithEventBus implements IResourceProvider {
    labelService: LabelService;
    resourceService: ResourceService;
    protected fileServiceClient: IFileServiceClient;
    scheme: string;
    private modifiedToResource;
    private userhomePath;
    onResourceDecorationChangeEvent(e: ResourceDecorationChangeEvent): void;
    private getCurrentUserHome;
    private getReadableTooltip;
    provideResource(uri: URI): Promise<IDiffResource>;
    shouldCloseResource(resource: any, openedResources: any): Promise<boolean>;
}
export declare class DefaultDiffEditorContribution implements BrowserEditorContribution {
    diffResourceProvider: DiffResourceProvider;
    registerResource(resourceService: ResourceService): void;
    registerEditorComponent(registry: EditorComponentRegistry): void;
}
//# sourceMappingURL=index.d.ts.map