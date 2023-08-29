import { URI, IDisposable } from '@opensumi/ide-core-browser';
import * as monaco from '@opensumi/monaco-editor-core/esm/vs/editor/editor.api';
import { IDecorationRenderOptions } from '../common';
import { IEditorDecorationCollectionService, IBrowserTextEditorDecorationType, IEditorDecorationProvider } from './types';
export declare class EditorDecorationCollectionService implements IEditorDecorationCollectionService {
    decorations: Map<string, IBrowserTextEditorDecorationType>;
    private readonly cssManager;
    private readonly themeService;
    private readonly iconService;
    private readonly eventBus;
    private tempId;
    constructor();
    getNextTempId(): string;
    decorationProviders: Map<string, IEditorDecorationProvider>;
    createTextEditorDecorationType(options: IDecorationRenderOptions, key?: string): IBrowserTextEditorDecorationType;
    getTextEditorDecorationType(key: any): IBrowserTextEditorDecorationType | undefined;
    private resolveDecoration;
    private addedThemeDecorationToCSSStyleSheet;
    private resolveCSSStyle;
    private resolveInlineCSSStyle;
    private resolveContentCSSStyle;
    registerDecorationProvider(provider: IEditorDecorationProvider): IDisposable;
    getDecorationFromProvider(uri: URI, key?: string): Promise<{
        [key: string]: monaco.editor.IModelDeltaDecoration[];
    }>;
}
//# sourceMappingURL=editor.decoration.service.d.ts.map