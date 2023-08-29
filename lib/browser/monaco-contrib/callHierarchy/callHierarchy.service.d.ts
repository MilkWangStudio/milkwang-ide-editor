/// <reference types="vscode" />
import { CancellationToken, IPosition, RefCountedDisposable, Uri } from '@opensumi/ide-core-common';
import { CallHierarchyItem, CallHierarchyProvider, ICallHierarchyService, IncomingCall, OutgoingCall } from '@opensumi/ide-monaco/lib/browser/contrib/callHierarchy';
import { ITextModel, Position } from '@opensumi/ide-monaco/lib/browser/monaco-api/types';
import { IEditorDocumentModelService } from '../../doc-model/types';
declare type ProviderResult<T> = T | undefined | null | Thenable<T | undefined | null>;
export declare class CallHierarchyModel {
    readonly id: string;
    readonly provider: CallHierarchyProvider;
    readonly roots: CallHierarchyItem[];
    readonly ref: RefCountedDisposable;
    static create(model: ITextModel, position: IPosition, token: CancellationToken): Promise<CallHierarchyModel | undefined>;
    readonly root: CallHierarchyItem;
    private constructor();
    dispose(): void;
    fork(item: CallHierarchyItem): CallHierarchyModel;
    resolveIncomingCalls(item: CallHierarchyItem, token: CancellationToken): Promise<IncomingCall[]>;
    resolveOutgoingCalls(item: CallHierarchyItem, token: CancellationToken): Promise<OutgoingCall[]>;
}
export declare class CallHierarchyService implements ICallHierarchyService {
    protected readonly modelService: IEditorDocumentModelService;
    private models;
    registerCallHierarchyProvider(selector: any, provider: CallHierarchyProvider): void;
    prepareCallHierarchyProvider(resource: Uri, position: Position): Promise<CallHierarchyItem[]>;
    provideIncomingCalls(item: CallHierarchyItem): ProviderResult<IncomingCall[]>;
    provideOutgoingCalls(item: CallHierarchyItem): ProviderResult<OutgoingCall[]>;
}
export {};
//# sourceMappingURL=callHierarchy.service.d.ts.map