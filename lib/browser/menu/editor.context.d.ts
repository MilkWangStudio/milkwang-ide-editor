import { Disposable, IContextKeyService } from '@opensumi/ide-core-browser';
import { AbstractContextMenuService, ICtxMenuRenderer } from '@opensumi/ide-core-browser/lib/menu/next';
import { ICodeEditor } from '@opensumi/ide-monaco/lib/common/types';
import { IAnchor } from '@opensumi/monaco-editor-core/esm/vs/base/browser/ui/contextview/contextview';
import { IEditorContribution } from '@opensumi/monaco-editor-core/esm/vs/editor/common/editorCommon';
import { ContextMenuController } from '@opensumi/monaco-editor-core/esm/vs/editor/contrib/contextmenu/browser/contextmenu';
export declare class EditorContextMenuController extends Disposable implements IEditorContribution {
    private readonly contextMenuService;
    private readonly globalContextKeyService;
    private readonly contextMenuRenderer;
    private codeEditor;
    static readonly ID = "editor.contrib.contextmenu";
    static get(editor: ICodeEditor): ContextMenuController | null;
    private readonly contextKeyService;
    constructor(contextMenuService: AbstractContextMenuService, globalContextKeyService: IContextKeyService, contextMenuRenderer: ICtxMenuRenderer, codeEditor: ICodeEditor);
    showContextMenu(anchor?: IAnchor | null): void;
    private onContextMenu;
    private _doShowContextMenu;
    private getMenuNodes;
}
//# sourceMappingURL=editor.context.d.ts.map