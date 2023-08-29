"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorContextMenuController = void 0;
const tslib_1 = require("tslib");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const next_1 = require("@opensumi/ide-core-browser/lib/menu/next");
const dom = tslib_1.__importStar(require("@opensumi/monaco-editor-core/esm/vs/base/browser/dom"));
const keyCodes_1 = require("@opensumi/monaco-editor-core/esm/vs/base/common/keyCodes");
const editorBrowser_1 = require("@opensumi/monaco-editor-core/esm/vs/editor/browser/editorBrowser");
const editorOptions_1 = require("@opensumi/monaco-editor-core/esm/vs/editor/common/config/editorOptions");
const contextmenu_1 = require("@opensumi/monaco-editor-core/esm/vs/editor/contrib/contextmenu/browser/contextmenu");
const monaco = tslib_1.__importStar(require("@opensumi/monaco-editor-core/esm/vs/editor/editor.api"));
class EditorContextMenuController extends ide_core_browser_1.Disposable {
    static get(editor) {
        return editor.getContribution(contextmenu_1.ContextMenuController.ID);
    }
    constructor(contextMenuService, globalContextKeyService, contextMenuRenderer, codeEditor) {
        super();
        this.contextMenuService = contextMenuService;
        this.globalContextKeyService = globalContextKeyService;
        this.contextMenuRenderer = contextMenuRenderer;
        this.codeEditor = codeEditor;
        this.contextKeyService = this.registerDispose(this.globalContextKeyService.createScoped(this.codeEditor._contextKeyService));
        this.addDispose(this.codeEditor.onContextMenu((e) => this.onContextMenu(e)));
        this.addDispose(this.codeEditor.onKeyDown((e) => {
            if (e.keyCode === keyCodes_1.KeyCode.ContextMenu) {
                e.preventDefault();
                e.stopPropagation();
                this.showContextMenu();
            }
        }));
    }
    showContextMenu(anchor) {
        if (!this.codeEditor.getOption(editorOptions_1.EditorOption.contextmenu)) {
            return; // Context menu is turned off through configuration
        }
        if (!this.codeEditor.hasModel()) {
            return;
        }
        if (!this.contextMenuService) {
            this.codeEditor.focus();
            return; // We need the context menu service to function
        }
        // Find actions available for menu
        const menuNodes = this.getMenuNodes();
        // Show menu if we have actions to show
        if (menuNodes.length > 0) {
            this._doShowContextMenu(menuNodes, anchor);
        }
    }
    // ref: https://github.com/microsoft/vscode/blob/1498d0f34053f854e75e1364adaca6f99e43de08/src/vs/editor/contrib/contextmenu/browser/contextmenu.ts
    onContextMenu(e) {
        if (!this.codeEditor.hasModel()) {
            return;
        }
        if (!this.codeEditor.getOption(editorOptions_1.EditorOption.contextmenu)) {
            this.codeEditor.focus();
            // Ensure the cursor is at the position of the mouse click
            if (e.target.position && !this.codeEditor.getSelection().containsPosition(e.target.position)) {
                this.codeEditor.setPosition(e.target.position);
            }
            return; // Context menu is turned off through configuration
        }
        if (e.target.type === editorBrowser_1.MouseTargetType.OVERLAY_WIDGET) {
            return; // allow native menu on widgets to support right click on input field for example in find
        }
        if (e.target.type === editorBrowser_1.MouseTargetType.CONTENT_TEXT && e.target.detail.injectedText) {
            return; // allow native menu on injected text
        }
        e.event.preventDefault();
        e.event.stopPropagation();
        if (e.target.type !== editorBrowser_1.MouseTargetType.CONTENT_TEXT &&
            e.target.type !== editorBrowser_1.MouseTargetType.CONTENT_EMPTY &&
            e.target.type !== editorBrowser_1.MouseTargetType.TEXTAREA) {
            return; // only support mouse click into text or native context menu key for now
        }
        // Ensure the editor gets focus if it hasn't, so the right events are being sent to other contributions
        this.codeEditor.focus();
        // Ensure the cursor is at the position of the mouse click
        if (e.target.position) {
            let hasSelectionAtPosition = false;
            for (const selection of this.codeEditor.getSelections()) {
                if (selection.containsPosition(e.target.position)) {
                    hasSelectionAtPosition = true;
                    break;
                }
            }
            if (!hasSelectionAtPosition) {
                this.codeEditor.setPosition(e.target.position);
            }
        }
        // Unless the user triggerd the context menu through Shift+F10, use the mouse position as menu position
        let anchor = null;
        if (e.target.type !== editorBrowser_1.MouseTargetType.TEXTAREA) {
            anchor = { x: e.event.posx - 1, width: 2, y: e.event.posy - 1, height: 2 };
        }
        // Show the context menu
        this.showContextMenu(anchor);
    }
    _doShowContextMenu(menuNodes, anchor) {
        const editor = this.codeEditor;
        // https://github.com/microsoft/vscode/blob/master/src/vs/editor/contrib/contextmenu/contextmenu.ts#L196
        if (!editor.hasModel()) {
            return;
        }
        // Disable hover
        const oldHoverSetting = editor.getOption(monaco.editor.EditorOption.hover);
        editor.updateOptions({
            hover: {
                enabled: false,
            },
        });
        if (!anchor) {
            // Ensure selection is visible
            editor.revealPosition(editor.getPosition(), monaco.editor.ScrollType.Immediate);
            editor.render();
            const cursorCoords = editor.getScrolledVisiblePosition(editor.getPosition());
            // Translate to absolute editor position
            const editorCoords = dom.getDomNodePagePosition(editor.getDomNode());
            const posx = editorCoords.left + cursorCoords.left;
            const posy = editorCoords.top + cursorCoords.top + cursorCoords.height;
            anchor = { x: posx, y: posy };
        }
        // Show the context menu
        this.contextMenuRenderer.show({
            anchor: {
                x: anchor.x - window.scrollX,
                y: anchor.y - window.scrollY,
            },
            menuNodes,
            args: [editor.getModel().uri],
            onHide: () => {
                // 无论是否取消都应该恢复 hover 的设置
                this.codeEditor.updateOptions({
                    hover: oldHoverSetting,
                });
                // 右键菜单关闭后应该使编辑器重新 focus
                // 原因是一些内置的 command (copy/cut/paste) 在执行时会在对应的 focusedEditor 执行，如果找不到 focusedEditor 则不会执行命令
                this.codeEditor.focus();
            },
        });
    }
    getMenuNodes() {
        const contextMenu = this.contextMenuService.createMenu({
            id: next_1.MenuId.EditorContext,
            contextKeyService: this.contextKeyService,
        });
        const menuNodes = contextMenu.getMergedMenuNodes();
        contextMenu.dispose();
        return menuNodes;
    }
}
exports.EditorContextMenuController = EditorContextMenuController;
EditorContextMenuController.ID = 'editor.contrib.contextmenu';
//# sourceMappingURL=editor.context.js.map