import { Disposable } from '@opensumi/ide-core-browser';
import { ResourceService } from '../../common';
import { BrowserEditorContribution, EditorComponentRegistry } from '../types';
export declare class MergeEditorContribution extends Disposable implements BrowserEditorContribution {
    private readonly mergeEditorResourceProvider;
    private readonly contextKeyService;
    registerResource(resourceService: ResourceService): void;
    registerEditorComponent(registry: EditorComponentRegistry): void;
}
//# sourceMappingURL=merge-editor.contribution.d.ts.map