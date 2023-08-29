import { ResourceService } from '../../common';
import { IEditorDocumentModelContentRegistry } from '../doc-model/types';
import { BrowserEditorContribution } from '../types';
import { BaseFileSystemEditorDocumentProvider } from './fs-editor-doc';
import { FileSystemResourceProvider } from './fs-resource';
export declare class FileSystemResourceContribution implements BrowserEditorContribution {
    fsResourceProvider: FileSystemResourceProvider;
    fsDocProvider: BaseFileSystemEditorDocumentProvider;
    registerResource(registry: ResourceService): void;
    registerEditorDocumentModelContentProvider(registry: IEditorDocumentModelContentRegistry): void;
}
//# sourceMappingURL=index.d.ts.map