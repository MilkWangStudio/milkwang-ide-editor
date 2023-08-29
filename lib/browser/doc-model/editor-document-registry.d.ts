import { URI, IDisposable, IEventBus } from '@opensumi/ide-core-browser';
import { IEditorDocumentModelContentRegistry, IEditorDocumentModelContentProvider } from './types';
export declare class EditorDocumentModelContentRegistryImpl implements IEditorDocumentModelContentRegistry {
    private providers;
    eventBus: IEventBus;
    private _onOriginalDocChanged;
    private originalProvider;
    private cachedProviders;
    constructor();
    registerEditorDocumentModelContentProvider(provider: IEditorDocumentModelContentProvider): IDisposable;
    getProvider(uri: URI): Promise<IEditorDocumentModelContentProvider | undefined>;
    protected calculateProvider(uri: URI): Promise<IEditorDocumentModelContentProvider | undefined>;
    getContentForUri(uri: URI, encoding?: string): Promise<string>;
}
//# sourceMappingURL=editor-document-registry.d.ts.map