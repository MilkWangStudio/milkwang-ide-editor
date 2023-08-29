import { ITextModelService, ITextModelContentProvider } from '@opensumi/monaco-editor-core/esm/vs/editor/common/services/resolverService';
import * as monaco from '@opensumi/monaco-editor-core/esm/vs/editor/editor.api';
import { IEditorDocumentModelService } from './types';
export declare class MonacoTextModelService implements ITextModelService {
    canHandleResource(resource: any): boolean;
    hasTextModelContentProvider(scheme: string): boolean;
    _serviceBrand: undefined;
    documentModelManager: IEditorDocumentModelService;
    createModelReference(resource: monaco.Uri): Promise<any>;
    registerTextModelContentProvider(scheme: string, provider: ITextModelContentProvider): monaco.IDisposable;
}
//# sourceMappingURL=override.d.ts.map