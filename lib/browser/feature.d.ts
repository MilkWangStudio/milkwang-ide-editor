import { IDisposable, ILogger, Event, URI } from '@opensumi/ide-core-browser';
import { IEditor } from '../common';
import { IEditorFeatureRegistry, IEditorFeatureContribution } from './types';
export declare class EditorFeatureRegistryImpl implements IEditorFeatureRegistry {
    private contributions;
    private _onDidRegisterFeature;
    readonly onDidRegisterFeature: Event<IEditorFeatureContribution>;
    logger: ILogger;
    registerEditorFeatureContribution(contribution: IEditorFeatureContribution): IDisposable;
    runContributions(editor: IEditor): void;
    runProvideEditorOptionsForUri(uri: URI): Promise<Partial<import("@opensumi/monaco-editor-core").editor.IEditorOptions>>;
    runOneContribution(editor: IEditor, contribution: IEditorFeatureContribution): void;
}
//# sourceMappingURL=feature.d.ts.map