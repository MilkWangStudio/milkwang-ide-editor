import { CommandService, Event, IPosition, MaybeNull, URI, WithEventBus } from '@opensumi/ide-core-browser';
import { LabelService } from '@opensumi/ide-core-browser/lib/services';
import { IFileServiceClient } from '@opensumi/ide-file-service/lib/common/file-service-client';
import { IWorkspaceService } from '@opensumi/ide-workspace/lib/common/workspace.interface';
import { IEditor } from '../../common';
import { EditorSelectionChangeEvent, IBreadCrumbPart, IBreadCrumbProvider } from '../types';
import { DocumentSymbolChangedEvent, DocumentSymbolStore, INormalizedDocumentSymbol } from './document-symbol';
export declare class DefaultBreadCrumbProvider extends WithEventBus implements IBreadCrumbProvider {
    private _onDidUpdateBreadCrumb;
    onDidUpdateBreadCrumb: Event<URI>;
    fileServiceClient: IFileServiceClient;
    workspaceService: IWorkspaceService;
    labelService: LabelService;
    commandService: CommandService;
    documentSymbolStore: DocumentSymbolStore;
    private debouncedFireUriEvent;
    private cachedBreadCrumb;
    handlesUri(uri: URI): boolean;
    provideBreadCrumbForUri(uri: URI, editor: MaybeNull<IEditor>): IBreadCrumbPart[];
    private getFileParts;
    private createFilePartBreadCrumbUri;
    private getDocumentSymbolParts;
    private createFromDocumentSymbol;
    onDocumentSymbolChangedEvent(e: DocumentSymbolChangedEvent): void;
    onEditorSelectionChangeEvent(e: EditorSelectionChangeEvent): void;
    private notifyUpdate;
}
export declare function findCurrentDocumentSymbol(documentSymbols: INormalizedDocumentSymbol[], position: MaybeNull<IPosition>): INormalizedDocumentSymbol[];
//# sourceMappingURL=default.d.ts.map