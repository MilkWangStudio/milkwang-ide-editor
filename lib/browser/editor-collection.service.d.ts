import { Injector } from '@opensumi/di';
import { IRange, IContextKeyService } from '@opensumi/ide-core-browser';
import { MonacoService } from '@opensumi/ide-core-browser/lib/monaco';
import { ILineChange, URI, WithEventBus, Disposable } from '@opensumi/ide-core-common';
import type { ICodeEditor as IMonacoCodeEditor, IDiffEditor as IMonacoDiffEditor } from '@opensumi/ide-monaco/lib/browser/monaco-api/types';
import * as monaco from '@opensumi/monaco-editor-core/esm/vs/editor/editor.api';
import { IConfigurationService } from '@opensumi/monaco-editor-core/esm/vs/platform/configuration/common/configuration';
import { ICodeEditor, IEditor, EditorCollectionService, IDiffEditor, CursorStatus, IUndoStopOptions, IDecorationApplyOptions, EditorType, IResourceOpenOptions } from '../common';
import { MonacoEditorDecorationApplier } from './decoration-applier';
import { IEditorDocumentModelRef, EditorDocumentModelContentChangedEvent, IEditorDocumentModelService, IEditorDocumentModel } from './doc-model/types';
import { EditorFeatureRegistryImpl } from './feature';
import { IEditorFeatureRegistry } from './types';
export declare class EditorCollectionServiceImpl extends WithEventBus implements EditorCollectionService {
    protected readonly monacoService: MonacoService;
    protected readonly injector: Injector;
    protected readonly configurationService: IConfigurationService;
    protected readonly editorFeatureRegistry: EditorFeatureRegistryImpl;
    private _editors;
    private _diffEditors;
    private _onCodeEditorCreate;
    private _onDiffEditorCreate;
    onCodeEditorCreate: import("@opensumi/ide-core-browser").Event<ICodeEditor>;
    onDiffEditorCreate: import("@opensumi/ide-core-browser").Event<IDiffEditor>;
    documentModelService: IEditorDocumentModelService;
    private _currentEditor;
    get currentEditor(): IEditor | undefined;
    constructor();
    createCodeEditor(dom: HTMLElement, options?: any, overrides?: {
        [key: string]: any;
    }): ICodeEditor;
    listEditors(): IMonacoImplEditor[];
    addEditors(editors: IMonacoImplEditor[]): void;
    removeEditors(editors: IMonacoImplEditor[]): void;
    createDiffEditor(dom: HTMLElement, options?: any, overrides?: {
        [key: string]: any;
    }): IDiffEditor;
    createMergeEditor(dom: HTMLElement, options?: any, overrides?: {
        [key: string]: any;
    }): import("@opensumi/ide-core-browser/lib/monaco/merge-editor-widget").IMergeEditorEditor;
    listDiffEditors(): IDiffEditor[];
    addDiffEditors(diffEditors: IDiffEditor[]): void;
    removeDiffEditors(diffEditors: IDiffEditor[]): void;
    onDocModelContentChangedEvent(e: EditorDocumentModelContentChangedEvent): void;
}
export type IMonacoImplEditor = IEditor;
export declare function insertSnippetWithMonacoEditor(editor: IMonacoCodeEditor, template: string, ranges: IRange[], opts: IUndoStopOptions): void;
export declare abstract class BaseMonacoEditorWrapper extends WithEventBus implements IEditor {
    readonly monacoEditor: IMonacoCodeEditor;
    private type;
    abstract readonly currentDocumentModel: IEditorDocumentModel | null;
    get currentUri(): URI | null;
    getId(): string;
    getSelections(): import("@opensumi/monaco-editor-core/esm/vs/editor/common/core/selection").Selection[];
    onFocus: import("@opensumi/ide-monaco/lib/browser/monaco-api/types").Event<void>;
    onBlur: import("@opensumi/ide-monaco/lib/browser/monaco-api/types").Event<void>;
    protected _specialEditorOptions: any;
    protected _specialModelOptions: monaco.editor.ITextModelUpdateOptions;
    protected _editorOptionsFromContribution: any;
    protected readonly editorFeatureRegistry: IEditorFeatureRegistry;
    protected readonly configurationService: IConfigurationService;
    protected readonly decorationApplier: MonacoEditorDecorationApplier;
    private _disableSelectionEmitter;
    protected disableSelectionEmitter(): void;
    protected enableSelectionEmitter(): void;
    private injector;
    constructor(monacoEditor: IMonacoCodeEditor, type: EditorType);
    private onDidChangeModel;
    getType(): EditorType;
    updateOptions(editorOptions?: monaco.editor.IEditorOptions, modelOptions?: monaco.editor.ITextModelUpdateOptions): void;
    private _doUpdateOptions;
    /**
     * 合并所有的选项
     * 优先关系: （从高到底）
     * 1. 当前编辑器的特殊选项（通过调用 updateOptions或者启动时传入）
     * 2. 来自 featureRegistry 的根据 当前uri 提供的选项
     * 3. 来自偏好设置的选项
     */
    private _calculateFinalOptions;
    insertSnippet(template: string, ranges: IRange[], opts: IUndoStopOptions): void;
    applyDecoration(key: string, options: IDecorationApplyOptions[]): void;
    onSelectionsChanged(listener: any): import("@opensumi/monaco-editor-core/esm/vs/base/common/lifecycle").IDisposable;
    onVisibleRangesChanged(listener: any): Disposable;
    setSelections(selections: any): void;
    setSelection(selection: any): void;
    save(): Promise<void>;
    onConfigurationChanged(listener: any): import("@opensumi/monaco-editor-core/esm/vs/base/common/lifecycle").IDisposable;
}
export declare class BrowserCodeEditor extends BaseMonacoEditorWrapper implements ICodeEditor {
    readonly monacoEditor: IMonacoCodeEditor;
    private collectionService;
    protected readonly editorFeatureRegistry: IEditorFeatureRegistry;
    private editorState;
    private readonly toDispose;
    protected _currentDocumentModelRef: IEditorDocumentModelRef;
    private _onCursorPositionChanged;
    onCursorPositionChanged: import("@opensumi/ide-core-browser").Event<CursorStatus>;
    _disposed: boolean;
    private _onRefOpen;
    onRefOpen: import("@opensumi/ide-core-browser").Event<IEditorDocumentModelRef>;
    get currentDocumentModel(): IEditorDocumentModel | null;
    getType(): EditorType;
    constructor(monacoEditor: IMonacoCodeEditor, options?: any);
    layout(): void;
    focus(): void;
    dispose(): void;
    protected saveCurrentState(): void;
    protected restoreState(): void;
    open(documentModelRef: IEditorDocumentModelRef): void;
}
export declare class BrowserDiffEditor extends WithEventBus implements IDiffEditor {
    readonly monacoDiffEditor: IMonacoDiffEditor;
    private specialOptions;
    private collectionService;
    private originalDocModelRef;
    private modifiedDocModelRef;
    get originalDocModel(): IEditorDocumentModel | null;
    get modifiedDocModel(): IEditorDocumentModel | null;
    originalEditor: IMonacoImplEditor;
    modifiedEditor: IMonacoImplEditor;
    _disposed: boolean;
    protected readonly injector: Injector;
    protected readonly configurationService: IConfigurationService;
    protected readonly contextKeyService: IContextKeyService;
    private editorState;
    private currentUri;
    private diffResourceKeys;
    protected saveCurrentState(): void;
    protected restoreState(): void;
    constructor(monacoDiffEditor: IMonacoDiffEditor, specialOptions?: any);
    compare(originalDocModelRef: IEditorDocumentModelRef, modifiedDocModelRef: IEditorDocumentModelRef, options?: IResourceOpenOptions, rawUri?: URI): Promise<void>;
    showFirstDiff(): void;
    private updateOptionsOnModelChange;
    isReadonly(): boolean;
    private doUpdateDiffOptions;
    updateDiffOptions(options: Partial<monaco.editor.IDiffEditorOptions>): void;
    getLineChanges(): ILineChange[] | null;
    private wrapEditors;
    layout(): void;
    focus(): void;
    dispose(): void;
}
//# sourceMappingURL=editor-collection.service.d.ts.map