import { IOpener, URI } from '@opensumi/ide-core-browser';
import { WorkbenchEditorService, ResourceService } from '../common';
export declare class EditorOpener implements IOpener {
    resourceService: ResourceService;
    workbenchEditorService: WorkbenchEditorService;
    open(uri: URI): Promise<boolean>;
    handleURI(uri: URI): Promise<boolean>;
    handleScheme(): boolean;
}
//# sourceMappingURL=editor-opener.d.ts.map