import { URI, MaybeNull, Event } from '@opensumi/ide-core-common';
import type { IEditorGroup } from '../../browser';
import { WorkbenchEditorService, IResourceOpenOptions, IUntitledOptions, IOpenResourceResult } from '../editor';
import { IResource } from '../resource';
export declare class MockWorkbenchEditorService extends WorkbenchEditorService {
    private readonly _onActiveResourceChange;
    readonly onActiveResourceChange: Event<MaybeNull<IResource>>;
    private readonly _onDidEditorGroupsChanged;
    readonly onDidEditorGroupsChanged: Event<void>;
    private readonly _onDidCurrentEditorGroupChanged;
    readonly onDidCurrentEditorGroupChanged: Event<IEditorGroup>;
    closeAll(uri?: URI, force?: boolean): Promise<void>;
    open(uri: URI, options?: IResourceOpenOptions): Promise<IOpenResourceResult>;
    openUris(uri: URI[]): Promise<void>;
    saveAll(includeUntitled?: boolean): Promise<void>;
    close(uri: any, force?: boolean): Promise<void>;
    getAllOpenedUris(): URI[];
    createUntitledResource(options?: IUntitledOptions): Promise<IOpenResourceResult>;
    setEditorContextKeyService(): void;
    calcDirtyCount(): number;
}
//# sourceMappingURL=workbench-editor.service.d.ts.map