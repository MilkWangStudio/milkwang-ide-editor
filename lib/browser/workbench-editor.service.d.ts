import { AppConfig, IContextKeyService, IScopedContextKeyService, PreferenceService, IOpenerService } from '@opensumi/ide-core-browser';
import { IMergeEditorEditor } from '@opensumi/ide-core-browser/lib/monaco/merge-editor-widget';
import { URI, MaybeNull, Deferred, Emitter as EventEmitter, Event, WithEventBus, StorageProvider, IStorage, ILogger } from '@opensumi/ide-core-common';
import { IDialogService } from '@opensumi/ide-overlay';
import { WorkbenchEditorService, EditorCollectionService, ICodeEditor, IResource, ResourceService, IResourceOpenOptions, IDiffEditor, IEditor, CursorStatus, IEditorOpenType, EditorGroupSplitAction, IEditorGroup, IOpenResourceResult, IEditorGroupState, ResourceDecorationChangeEvent, IUntitledOptions, SaveReason } from '../common';
import { IEditorDocumentModelService, IEditorDocumentModelRef } from './doc-model/types';
import { IGridEditorGroup, EditorGrid } from './grid/grid.service';
import { EditorComponentRegistry, IEditorComponent, DragOverPosition, EditorGroupChangeEvent, EditorGroupCloseEvent, ResourceOpenTypeChangedEvent } from './types';
export declare class WorkbenchEditorServiceImpl extends WithEventBus implements WorkbenchEditorService {
    editorGroups: EditorGroup[];
    _onDidEditorGroupsChanged: EventEmitter<void>;
    onDidEditorGroupsChanged: Event<void>;
    private _sortedEditorGroups;
    private injector;
    private resourceService;
    private readonly _onActiveResourceChange;
    readonly onActiveResourceChange: Event<MaybeNull<IResource>>;
    private readonly _onActiveEditorUriChange;
    readonly onActiveEditorUriChange: Event<MaybeNull<URI>>;
    private readonly _onCursorChange;
    readonly onCursorChange: Event<CursorStatus>;
    topGrid: EditorGrid;
    private _currentEditorGroup;
    private _onDidCurrentEditorGroupChanged;
    onDidCurrentEditorGroupChanged: Event<IEditorGroup>;
    getStorage: StorageProvider;
    protected dialogService: IDialogService;
    openedResourceState: IStorage;
    private _restoring;
    contributionsReady: Deferred<void>;
    private initializing;
    editorContextKeyService: IScopedContextKeyService;
    private _domNode;
    openner: IOpenerService;
    private readonly contributions;
    protected documentModelManager: IEditorDocumentModelService;
    private untitledIndex;
    private untitledCloseIndex;
    gridReady: boolean;
    private _onDidGridReady;
    onDidGridReady: Event<void>;
    constructor();
    setEditorContextKeyService(contextKeyService: IScopedContextKeyService): void;
    setCurrentGroup(editorGroup: EditorGroup): void;
    onEditorGroupChangeEvent(e: EditorGroupChangeEvent): void;
    getAllOpenedUris(): URI[];
    saveAll(includeUntitled?: boolean, reason?: SaveReason): Promise<void>;
    hasDirty(): boolean;
    calcDirtyCount(): number;
    createEditorGroup(): EditorGroup;
    /**
     * 随机生成一个不重复的editor Group
     */
    private generateRandomEditorGroupName;
    initialize(): Promise<any>;
    private doInitialize;
    private initializeState;
    get currentEditor(): IEditor | null;
    get currentCodeEditor(): ICodeEditor | null;
    get currentEditorGroup(): EditorGroup;
    get currentOrPreviousFocusedEditor(): IEditor | null;
    open(uri: URI, options?: IResourceOpenOptions): Promise<IOpenResourceResult>;
    openUris(uris: URI[]): Promise<void>;
    getEditorGroup(name: string): EditorGroup | undefined;
    get currentResource(): MaybeNull<IResource>;
    removeGroup(group: EditorGroup): void;
    saveOpenedResourceState(): Promise<void>;
    prepareContextKeyService(): void;
    onDomCreated(domNode: HTMLElement): void;
    private notifyGroupChanged;
    restoreState(): Promise<void>;
    closeAll(uri?: URI, force?: boolean): Promise<void>;
    /**
     * Return true in order to prevent exit.
     */
    closeAllOnlyConfirmOnce(): Promise<boolean>;
    close(uri: URI, force?: boolean): Promise<void>;
    get sortedEditorGroups(): EditorGroup[];
    handleOnCloseUntitledResource(e: EditorGroupCloseEvent): void;
    private createUntitledURI;
    createUntitledResource(options?: IUntitledOptions): Promise<IOpenResourceResult>;
}
export interface IEditorCurrentState {
    currentResource: IResource;
    currentOpenType: IEditorOpenType;
}
/**
 * Editor Group是一个可视的编辑区域
 * 它由tab，editor，diff-editor，富组件container组成
 */
export declare class EditorGroup extends WithEventBus implements IGridEditorGroup {
    readonly name: string;
    collectionService: EditorCollectionService;
    resourceService: ResourceService;
    editorComponentRegistry: EditorComponentRegistry;
    workbenchEditorService: WorkbenchEditorServiceImpl;
    protected documentModelManager: IEditorDocumentModelService;
    private commands;
    protected readonly preferenceService: PreferenceService;
    private readonly recentFilesManager;
    private messageService;
    private reporterService;
    config: AppConfig;
    private readonly openerService;
    logger: ILogger;
    codeEditor: ICodeEditor;
    diffEditor: IDiffEditor;
    mergeEditor: IMergeEditorEditor;
    private openingPromise;
    _onDidEditorFocusChange: EventEmitter<void>;
    onDidEditorFocusChange: Event<void>;
    /**
     * 当编辑器的tab部分发生变更
     */
    _onDidEditorGroupTabChanged: EventEmitter<void>;
    onDidEditorGroupTabChanged: Event<void>;
    /**
     * 当编辑器的主体部分发生变更
     */
    _onDidEditorGroupBodyChanged: EventEmitter<void>;
    onDidEditorGroupBodyChanged: Event<void>;
    /**
     * 当编辑器有内容处于加载状态
     */
    _onDidEditorGroupContentLoading: EventEmitter<IResource<any>>;
    onDidEditorGroupContentLoading: Event<IResource>;
    /**
     * 每个group只能有一个preview
     */
    previewURI: URI | null;
    /**
     * 当前打开的所有resource
     */
    resources: IResource[];
    resourceStatus: Map<IResource, Promise<void>>;
    _currentResource: IResource | null;
    _currentOpenType: IEditorOpenType | null;
    /**
     * 当前resource的打开方式
     */
    private cachedResourcesActiveOpenTypes;
    private cachedResourcesOpenTypes;
    availableOpenTypes: IEditorOpenType[];
    activeComponents: Map<IEditorComponent<any>, IResource<any>[]>;
    activateComponentsProps: Map<IEditorComponent<any>, any>;
    grid: EditorGrid;
    private holdDocumentModelRefs;
    private readonly toDispose;
    private _contextKeyService;
    private _resourceContext;
    private _editorLangIDContextKey;
    private _isInDiffEditorContextKey;
    private _diffResourceContextKey;
    private _isInDiffRightEditorContextKey;
    private _isInEditorComponentContextKey;
    private _prevDomHeight;
    private _prevDomWidth;
    private _codeEditorPendingLayout;
    private _diffEditorPendingLayout;
    private _mergeEditorPendingLayout;
    private _onCurrentEditorCursorChange;
    onCurrentEditorCursorChange: Event<CursorStatus>;
    private resourceOpenHistory;
    private _domNode;
    private _diffEditorDomNode;
    private _diffEditorDomNodeAttached;
    private _mergeEditorDomNode;
    private _mergeEditorDomNodeAttached;
    private codeEditorReady;
    private diffEditorReady;
    private diffEditorDomReady;
    private mergeEditorReady;
    private mergeEditorDomReady;
    private _restoringState;
    private updateContextKeyWhenEditorChangesFocusDisposer;
    private _currentOrPreviousFocusedEditor;
    constructor(name: string);
    private explorerAutoRevealConfig;
    private listenToExplorerAutoRevealConfig;
    attachDiffEditorDom(domNode: HTMLElement | null | undefined): void;
    attachMergeEditorDom(domNode: HTMLElement | null | undefined): void;
    attachToDom(domNode: HTMLElement | null | undefined): void;
    layoutEditors(): void;
    doLayoutEditors(): void;
    setContextKeys(): void;
    private updateContextKeyWhenDiffEditorChangesFocus;
    get contextKeyService(): IContextKeyService;
    get index(): number;
    onResourceDecorationChangeEvent(e: ResourceDecorationChangeEvent): void;
    oResourceOpenTypeChangedEvent(e: ResourceOpenTypeChangedEvent): void;
    onRegisterEditorComponentEvent(): Promise<void>;
    pinPreviewed(uri?: URI): void;
    private notifyTabChanged;
    private notifyBodyChanged;
    private notifyTabLoading;
    get currentEditor(): IEditor | null;
    get currentOrPreviousFocusedEditor(): IEditor | null;
    get currentFocusedEditor(): IEditor | null;
    get currentCodeEditor(): ICodeEditor | null;
    createEditor(dom: HTMLElement): void;
    createMergeEditor(dom: HTMLElement): void;
    createDiffEditor(dom: HTMLElement): void;
    private addDiffEditorEventListeners;
    split(action: EditorGroupSplitAction, uri: URI, options?: IResourceOpenOptions): Promise<IOpenResourceResult>;
    open(uri: URI, options?: IResourceOpenOptions): Promise<IOpenResourceResult>;
    pin(uri: URI): Promise<void>;
    doOpen(uri: URI, options?: IResourceOpenOptions): Promise<{
        group: IEditorGroup;
        resource: IResource;
    } | false>;
    private locationInTree;
    private locateInFileTree;
    private locateInOpenedEditor;
    openUris(uris: URI[]): Promise<void>;
    getDocumentModelRef(uri: URI): Promise<IEditorDocumentModelRef>;
    disposeDocumentRef(uri: URI): void;
    protected doDisposeDocRef(uri: URI): void;
    private openCodeEditor;
    private openDiffEditor;
    private openMergeEditor;
    private openCustomEditor;
    private displayResourceComponent;
    private resolveTabChanged;
    private resolveOpenType;
    close(uri: URI, { treatAsNotCurrent, force, }?: {
        treatAsNotCurrent?: boolean;
        force?: boolean;
    }): Promise<void>;
    private shouldClose;
    private backToEmpty;
    /**
     * 关闭全部
     */
    closeAll(): Promise<void>;
    /**
     * 关闭已保存（非dirty）
     */
    closeSaved(): Promise<void>;
    /**
     * 关闭向右的tab
     * @param uri
     */
    closeToRight(uri: URI): Promise<void>;
    clearResourceOnClose(resource: IResource): void;
    closeOthers(uri: URI): Promise<void>;
    /**
     * 当前打开的resource
     */
    get currentResource(): MaybeNull<IResource>;
    get currentOpenType(): MaybeNull<IEditorOpenType>;
    changeOpenType(id: string): Promise<void>;
    /**
     * 拖拽drop方法
     */
    dropUri(uri: URI, position: DragOverPosition, sourceGroup?: EditorGroup, targetResource?: IResource): Promise<void>;
    gainFocus(): void;
    focus(): void;
    dispose(): void;
    getState(): IEditorGroupState;
    isCodeEditorMode(): boolean;
    isDiffEditorMode(): boolean;
    isComponentMode(): boolean;
    restoreState(state: IEditorGroupState): Promise<void>;
    saveAll(includeUntitled?: boolean, reason?: SaveReason): Promise<void>;
    saveResource(resource: IResource, reason?: SaveReason): Promise<void>;
    saveByOpenType(resource: IResource, reason: SaveReason): Promise<boolean>;
    saveCurrent(reason?: SaveReason): Promise<void>;
    hasDirty(): boolean;
    /**
     * 计算 dirty 数量
     */
    calcDirtyCount(countedUris?: Set<string>): number;
    componentUndo(): void;
    componentRedo(): void;
    /**
     * 防止作为参数被抛入插件进程时出错
     */
    toJSON(): {
        name: string;
    };
}
//# sourceMappingURL=workbench-editor.service.d.ts.map