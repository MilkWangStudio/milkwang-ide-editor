import { CommandService, QuickOpenHandler } from '@opensumi/ide-core-browser';
import { QuickOpenItem, PrefixQuickOpenService, QuickOpenModel } from '@opensumi/ide-core-browser/lib/quick-open';
import { Event as MonacoEvent } from '@opensumi/ide-monaco/lib/browser/monaco-api/types';
import { IRange as IMonacoRange } from '@opensumi/monaco-editor-core/esm/vs/editor/common/core/range';
import { IEditor as IMonacoCodeEditor } from '@opensumi/monaco-editor-core/esm/vs/editor/common/editorCommon';
import { AbstractGotoLineQuickAccessProvider } from '@opensumi/monaco-editor-core/esm/vs/editor/contrib/quickAccess/browser/gotoLineQuickAccess';
import * as monaco from '@opensumi/monaco-editor-core/esm/vs/editor/editor.api';
declare class MonacoGoToLine extends AbstractGotoLineQuickAccessProvider {
    activeTextEditorControl: IMonacoCodeEditor | undefined;
    onDidActiveTextEditorControlChange: MonacoEvent<void>;
    clearDecorations(editor: IMonacoCodeEditor): void;
    preview(editor: IMonacoCodeEditor, range: IMonacoRange): void;
    goTo(editor: IMonacoCodeEditor, range: IMonacoRange, preserveFocus?: boolean): void;
}
export declare class GoToLineQuickOpenHandler implements QuickOpenHandler {
    readonly prefix: string;
    readonly description: string;
    protected items: QuickOpenItem[];
    protected readonly quickOpenService: PrefixQuickOpenService;
    commandService: CommandService;
    private readonly workbenchEditorService;
    quickAccess: MonacoGoToLine;
    savedViewState?: monaco.editor.ICodeEditorViewState;
    constructor();
    getFirstSelection(): import("@opensumi/ide-core-browser").ISelection | undefined;
    getRange(line?: number, col?: number): monaco.IRange;
    init(): void;
    getModel(): QuickOpenModel;
    getOptions(): {};
    onClose(canceled: any): void;
}
export {};
//# sourceMappingURL=go-to-line.d.ts.map