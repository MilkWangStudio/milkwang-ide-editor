import { Disposable, IEventBus } from '@opensumi/ide-core-common';
import type { ICodeEditor as IMonacoCodeEditor } from '@opensumi/ide-monaco/lib/browser/monaco-api/types';
import { IThemeService } from '@opensumi/ide-theme';
import * as monaco from '@opensumi/monaco-editor-core/esm/vs/editor/editor.api';
import { IDecorationRenderOptions, IDecorationApplyOptions } from '../common';
import { IEditorDecorationCollectionService } from './types';
export declare class MonacoEditorDecorationApplier extends Disposable {
    private editor;
    decorationService: IEditorDecorationCollectionService;
    themeService: IThemeService;
    eventBus: IEventBus;
    private decorations;
    constructor(editor: IMonacoCodeEditor);
    private getEditorUri;
    private applyDecorationFromProvider;
    dispose(): void;
    clearDecorations(): void;
    deltaDecoration(key: string, decorations: monaco.editor.IModelDeltaDecoration[]): void;
    applyDecoration(key: string, options: IDecorationApplyOptions[]): void;
    resolveDecorationRenderer(key: string, options?: IDecorationRenderOptions): {
        options: monaco.editor.IModelDecorationOptions;
        dispose: () => void;
    };
}
//# sourceMappingURL=decoration-applier.d.ts.map