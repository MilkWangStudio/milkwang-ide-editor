import { Provider, Injector } from '@opensumi/di';
import { BrowserModule, ClientAppContribution } from '@opensumi/ide-core-browser';
import { ResourceService } from '../common';
import { EditorDocumentModelServiceImpl } from './doc-model/main';
import { IEditorDocumentModelContentRegistry } from './doc-model/types';
import { EditorElectronContribution } from './editor-electron.contribution';
import { EditorComponentRegistry, IEditorActionRegistry, IEditorFeatureRegistry } from './types';
import { WorkbenchEditorServiceImpl } from './workbench-editor.service';
export * from './preference/schema';
export * from './types';
export * from './doc-model/types';
export * from './doc-cache';
export * from './editor.less';
export * from './view/editor.react';
export declare class EditorModule extends BrowserModule {
    providers: Provider[];
    electronProviders: (typeof EditorElectronContribution)[];
    contributionProvider: symbol;
}
export declare class EditorClientAppContribution implements ClientAppContribution {
    resourceService: ResourceService;
    editorComponentRegistry: EditorComponentRegistry;
    workbenchEditorService: WorkbenchEditorServiceImpl;
    modelContentRegistry: IEditorDocumentModelContentRegistry;
    editorActionRegistry: IEditorActionRegistry;
    editorFeatureRegistry: IEditorFeatureRegistry;
    injector: Injector;
    modelService: EditorDocumentModelServiceImpl;
    private readonly contributions;
    initialize(): Promise<void>;
    onDidStart(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map