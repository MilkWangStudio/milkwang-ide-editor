import { URI, IDisposable, WithEventBus } from '@opensumi/ide-core-browser';
import { ILogger } from '@opensumi/ide-core-common';
import { ResourceService, IResource, IResourceProvider, ResourceNeedUpdateEvent, IResourceDecoration, ResourceDecorationNeedChangeEvent, AskSaveResult } from '../common';
export declare class ResourceServiceImpl extends WithEventBus implements ResourceService {
    private providers;
    private resources;
    private gettingResources;
    private resourceDecoration;
    private cachedProvider;
    private onRegisterResourceProviderEmitter;
    readonly onRegisterResourceProvider: import("@opensumi/ide-core-browser").Event<IResourceProvider>;
    private onUnregisterResourceProviderEmitter;
    readonly onUnregisterResourceProvider: import("@opensumi/ide-core-browser").Event<IResourceProvider>;
    logger: ILogger;
    constructor();
    onResourceNeedUpdateEvent(e: ResourceNeedUpdateEvent): void;
    onResourceDecorationChangeEvent(e: ResourceDecorationNeedChangeEvent): void;
    getSupportedSchemes(): string[];
    getResource(uri: URI): Promise<IResource<any> | null>;
    handlesUri(uri: URI): boolean;
    doGetResource(uri: URI): Promise<{
        resource: IResource<any>;
        provider: IResourceProvider;
    } | null>;
    registerResourceProvider(provider: IResourceProvider): IDisposable;
    shouldCloseResource(resource: IResource, openedResources: IResource[][]): Promise<boolean>;
    shouldCloseResourceWithoutConfirm(resource: IResource<any>): Promise<boolean>;
    close(resource: IResource<any>, saveAction: AskSaveResult): Promise<boolean>;
    private calculateProvider;
    private getProvider;
    getResourceDecoration(uri: URI): IResourceDecoration;
    getResourceSubname(resource: IResource<any>, groupResources: IResource<any>[]): string | null;
    disposeResource(resource: IResource<any>): void;
}
//# sourceMappingURL=resource.service.d.ts.map