import { URI, IEditorDocumentChange, IEditorDocumentModelSaveResult, Disposable, CancellationToken } from '@opensumi/ide-core-browser';
import { EOL } from '@opensumi/ide-monaco/lib/browser/monaco-api/types';
import { IEditorDocumentModelService } from './types';
export interface IEditorDocumentModelServiceImpl extends IEditorDocumentModelService {
    saveEditorDocumentModel(uri: URI, content: string, baseContent: string, changes: IEditorDocumentChange[], encoding?: string, ignoreDiff?: boolean, eol?: EOL, token?: CancellationToken): Promise<IEditorDocumentModelSaveResult>;
}
export declare class SaveTask extends Disposable {
    private uri;
    readonly versionId: number;
    readonly alternativeVersionId: number;
    content: string;
    private ignoreDiff;
    private deferred;
    finished: Promise<IEditorDocumentModelSaveResult>;
    private cancelToken;
    started: boolean;
    constructor(uri: URI, versionId: number, alternativeVersionId: number, content: string, ignoreDiff: boolean);
    run(service: IEditorDocumentModelServiceImpl, baseContent: string, changes: IEditorDocumentChange[], encoding?: string, eol?: EOL): Promise<IEditorDocumentModelSaveResult>;
    cancel(): void;
}
//# sourceMappingURL=save-task.d.ts.map