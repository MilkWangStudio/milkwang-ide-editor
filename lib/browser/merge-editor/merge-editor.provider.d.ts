import { URI, WithEventBus, MaybePromise } from '@opensumi/ide-core-browser';
import { IResourceProvider, IResource } from '../../common';
export declare class MergeEditorResourceProvider extends WithEventBus implements IResourceProvider {
    scheme: string;
    private readonly labelService;
    private readonly mergeEditorService;
    provideResource(uri: URI): MaybePromise<IResource<any>>;
    shouldCloseResource(resource: IResource<any>, openedResources: IResource<any>[][]): MaybePromise<boolean>;
}
//# sourceMappingURL=merge-editor.provider.d.ts.map