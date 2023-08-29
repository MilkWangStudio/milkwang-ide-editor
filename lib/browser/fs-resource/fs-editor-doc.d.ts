import { Emitter, URI, Event, IApplicationService, IEditorDocumentChange, IEditorDocumentModelSaveResult, PreferenceService, EncodingRegistry } from '@opensumi/ide-core-browser';
import { IFileServiceClient } from '@opensumi/ide-file-service';
import { EOL } from '@opensumi/ide-monaco/lib/browser/monaco-api/types';
import { IEditorDocumentModelContentProvider } from '../doc-model/types';
import { EditorPreferences } from '../preference/schema';
export interface ReadEncodingOptions {
    /**
     * The optional encoding parameter allows to specify the desired encoding when resolving
     * the contents of the file.
     */
    encoding?: string;
    /**
     * The optional guessEncoding parameter allows to guess encoding from content of the file.
     */
    autoGuessEncoding?: boolean;
}
/**
 * 通用的用来处理 FileSystem 提供的文档
 * 可以 extend 这个来添加更强的能力，如 file-scheme 中的 file-doc
 */
export declare class BaseFileSystemEditorDocumentProvider implements IEditorDocumentModelContentProvider {
    protected _onDidChangeContent: Emitter<URI>;
    onDidChangeContent: Event<URI>;
    protected _fileContentMd5OnBrowserFs: Set<string>;
    private _detectedEncodingMap;
    protected readonly fileServiceClient: IFileServiceClient;
    protected readonly editorPreferences: EditorPreferences;
    protected readonly applicationService: IApplicationService;
    protected readonly preferenceService: PreferenceService;
    encodingRegistry: EncodingRegistry;
    constructor();
    handlesScheme(scheme: string): boolean;
    provideEncoding(uri: URI): string;
    provideEOL(uri: URI): Promise<EOL>;
    read(uri: URI, options: ReadEncodingOptions): Promise<{
        encoding: string;
        content: string;
    }>;
    provideEditorDocumentModelContent(uri: URI, encoding: string): Promise<string>;
    isReadonly(uri: URI): Promise<boolean>;
    saveDocumentModel(uri: URI, content: string, baseContent: string, changes: IEditorDocumentChange[], encoding: string, ignoreDiff?: boolean): Promise<IEditorDocumentModelSaveResult>;
    onDidDisposeModel(uri: URI): void;
    guessEncoding(uri: URI): Promise<string>;
    protected getReadEncoding(resource: URI, options: ReadEncodingOptions | undefined, detectedEncoding: string | null): Promise<string>;
    protected getEncodingForResource(resource: URI, preferredEncoding?: string): Promise<string>;
}
//# sourceMappingURL=fs-editor-doc.d.ts.map