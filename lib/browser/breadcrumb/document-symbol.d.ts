import { WithEventBus, BasicEvent, URI, CancellationToken } from '@opensumi/ide-core-browser';
import { DocumentSymbol, SymbolTag } from '@opensumi/monaco-editor-core/esm/vs/editor/common/languages';
import { WorkbenchEditorService } from '../../common';
import { IEditorDocumentModelService, EditorDocumentModelContentChangedEvent } from '../doc-model/types';
export declare class DocumentSymbolStore extends WithEventBus {
    editorDocumentModelRegistry: IEditorDocumentModelService;
    editorService: WorkbenchEditorService;
    private documentSymbols;
    private pendingUpdate;
    private debounced;
    private symbolDeferred;
    constructor();
    getDocumentSymbol(uri: URI): INormalizedDocumentSymbol[] | undefined;
    /**
     * 等待获取文件 symbol，否则文件搜索一个未打开过的文件 symbols 为空
     */
    getDocumentSymbolAsync(uri: URI, token?: CancellationToken): Promise<INormalizedDocumentSymbol[] | undefined>;
    createDocumentSymbolCache(uri: URI): Promise<void>;
    doUpdateDocumentSymbolCache(uri: URI): Promise<void>;
    updateDocumentSymbolCache(uri: URI): void;
    onEditorDocumentModelContentChangedEvent(e: EditorDocumentModelContentChangedEvent): void;
    private markNeedUpdate;
    private isWatching;
}
export declare class DocumentSymbolChangedEvent extends BasicEvent<URI> {
}
export { DocumentSymbol, SymbolTag };
export interface INormalizedDocumentSymbol extends DocumentSymbol {
    parent?: INormalizedDocumentSymbol | IDummyRoot;
    children?: INormalizedDocumentSymbol[];
    id: string;
}
export interface IDummyRoot {
    children?: INormalizedDocumentSymbol[];
}
//# sourceMappingURL=document-symbol.d.ts.map