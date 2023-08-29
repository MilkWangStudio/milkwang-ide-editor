import type { ICodeEditor as IMonacoCodeEditor } from '@opensumi/monaco-editor-core/esm/vs/editor/browser/editorBrowser';
import { AbstractCodeEditorService } from '@opensumi/monaco-editor-core/esm/vs/editor/browser/services/abstractCodeEditorService';
import { ICodeEditorService } from '@opensumi/monaco-editor-core/esm/vs/editor/browser/services/codeEditorService';
import * as monaco from '@opensumi/monaco-editor-core/esm/vs/editor/editor.api';
import { ContextViewService } from '@opensumi/monaco-editor-core/esm/vs/platform/contextview/browser/contextViewService';
export declare class MonacoCodeService extends AbstractCodeEditorService {
    private workbenchEditorService;
    private preferenceService;
    constructor();
    getActiveCodeEditor(): IMonacoCodeEditor | null;
    /**
     * TODO 拆分状态的兼容
     * 判断model是否已存在，在当前editor打开该model
     * @param input 输入的目标文件信息
     * @param source 触发的来源Editor，与grid关联使用
     * @param sideBySide ？
     */
    openCodeEditor(input: monaco.editor.IResourceInput, source: IMonacoCodeEditor | null, sideBySide?: boolean): Promise<IMonacoCodeEditor | null>;
}
export declare class MonacoContextViewService extends ContextViewService {
    private menuContainer;
    constructor(codeEditorService: ICodeEditorService);
    setContainer(container: any): void;
}
//# sourceMappingURL=editor.override.d.ts.map