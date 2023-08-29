/// <reference types="react" />
import { MaybePromise, IDisposable, BasicEvent, IRange, MaybeNull, ISelection, URI, Event } from '@opensumi/ide-core-browser';
import { IContextMenu } from '@opensumi/ide-core-browser/lib/menu/next';
import { IThemeColor } from '@opensumi/ide-core-common';
import { editor } from '@opensumi/monaco-editor-core/esm/vs/editor/editor.api';
import { IResource, ResourceService, IEditorGroup, IDecorationRenderOptions, ITextEditorDecorationType, TrackedRangeStickiness, OverviewRulerLane, IEditorOpenType, IEditor, DragOverPosition, EditorOpenType } from '../common';
import { IEditorDocumentModelContentRegistry } from './doc-model/types';
import { EditorGroup } from './workbench-editor.service';
export * from '../common';
export type ReactEditorComponent<MetaData = any> = React.ComponentType<{
    resource: IResource<MetaData>;
}>;
export interface IEditorComponent<MetaData = any> {
    uid: string;
    component: ReactEditorComponent<MetaData>;
    scheme?: string;
    renderMode?: EditorComponentRenderMode;
}
export type EditorSide = 'bottom' | 'top';
export interface IEditorSideWidget<MetaData = any> {
    /**
     * id, 需要唯一，会作为react组件的key
     */
    id: string;
    /**
     * TODO: 当前仅支持bottom
     */
    side?: EditorSide;
    /**
     * 组件元素
     */
    component: ReactEditorComponent<MetaData>;
    /**
     * 排序因子, 默认10
     */
    weight?: number;
    /**
     * 是否要在某个resource显示
     */
    displaysOnResource: (resource: IResource<any>) => boolean;
    /**
     * editorSide view 组件传入的props
     */
    initialProps?: unknown;
}
/**
 * 默认值: ONE_PER_GROUP
 * ONE_PER_RESOURCE  - 每个资源只初始化一次组件
 * ONE_PER_GROUP     - 每个资源在同个 Group 下只初始化一次组件
 * ONE_PER_WORKBENCH - 整个渲染过程复用同一个组件，即组件仅会初始化一次
 */
export declare enum EditorComponentRenderMode {
    ONE_PER_RESOURCE = 1,
    ONE_PER_GROUP = 2,
    ONE_PER_WORKBENCH = 3
}
/**
 * 注册编辑器组件 Resolver 时触发
 */
export declare class RegisterEditorComponentResolverEvent extends BasicEvent<string> {
}
/**
 * 注册编辑器组件时触发
 */
export declare class RegisterEditorComponentEvent extends BasicEvent<string> {
}
export declare abstract class EditorComponentRegistry {
    abstract registerEditorComponent<T>(component: IEditorComponent<T>, initialProps?: any): IDisposable;
    abstract registerEditorComponentResolver<T>(scheme: string, resolver: IEditorComponentResolver<T>): IDisposable;
    abstract registerEditorComponentResolver<T>(handlesScheme: (scheme: string) => number, resolver: IEditorComponentResolver<T>): IDisposable;
    abstract resolveEditorComponent(resource: IResource): Promise<IEditorOpenType[]>;
    abstract getEditorComponent(id: string): IEditorComponent | null;
    abstract getEditorInitialProps(id: string): any;
    abstract clearPerWorkbenchComponentCache(componentId: string): void;
    /**
     * 注册一个编辑器的边缘组件（目前只开放了bottom、top)
     * @param widget
     */
    abstract registerEditorSideWidget(widget: IEditorSideWidget): IDisposable;
    abstract getSideWidgets(side: EditorSide, resource: IResource): IEditorSideWidget<any>[];
}
/**
 * 打开资源的处理委派函数
 * @param resource 要打开的资源
 * @param results 在执行此责任委派函数前，已经支持的打开方式
 * @param resolve 调用这个函数，传入结果可结束责任链直接返回支持的打开方式
 */
export type IEditorComponentResolver<MetaData = any> = (resource: IResource<MetaData>, results: IEditorOpenType[], resolve: (results: IEditorOpenType[]) => void) => MaybePromise<void>;
export declare const BrowserEditorContribution: unique symbol;
export interface BrowserEditorContribution {
    /**
     * 用来在合适的时机向 `ResourceService` 注册可以在编辑器内打开的资源。
     *
     * 为了让一个 uri 能够在编辑器中被打开，首先需要向 `ResourceService` 注册一个用于解析 uri 至一个编辑器资源（`IResource`) 的 `IResourceProvider`。
     * 它的主要职责是在这个 uri 在编辑器标签 Tab 上显示时提供它的名称、图标、是否被编辑等状态，以及相应这个 tab 被关闭时的回调等等。
     *
     * @param resourceService
     */
    registerResource?(resourceService: ResourceService): void;
    /**
     * 用来在合适的时机向 `EditorComponentRegistry` 注册编辑器组件、打开方式等功能。
     *
     * 一个 uri 对应的编辑器资源 (`IResource`) 需要能够在编辑器中展示，还需要为它注册对应的一个或者多个打开方式，以及对应打开方式使用的 React 组件。
     * @param editorComponentRegistry
     */
    registerEditorComponent?(editorComponentRegistry: EditorComponentRegistry): void;
    registerEditorDocumentModelContentProvider?(registry: IEditorDocumentModelContentRegistry): void;
    /**
     * @deprecated
     * @param editorActionRegistry
     */
    registerEditorActions?(editorActionRegistry: IEditorActionRegistry): void;
    /**
     * 当进入 IDE 时，编辑器会尝试恢复上一次打开的编辑器组和组内打开的文件
     * 完成后会执行 onDidRestoreState 这个 hook
     */
    onDidRestoreState?(): void;
    registerEditorFeature?(registry: IEditorFeatureRegistry): any;
}
export interface IGridResizeEventPayload {
    gridId: string;
}
export declare class GridResizeEvent extends BasicEvent<IGridResizeEventPayload> {
}
export declare class EditorGroupOpenEvent extends BasicEvent<{
    group: IEditorGroup;
    resource: IResource;
}> {
}
export declare class EditorGroupCloseEvent extends BasicEvent<{
    group: IEditorGroup;
    resource: IResource;
}> {
}
export declare class EditorGroupDisposeEvent extends BasicEvent<{
    group: IEditorGroup;
}> {
}
export declare class EditorGroupChangeEvent extends BasicEvent<IEditorGroupChangePayload> {
}
export declare class EditorActiveResourceStateChangedEvent extends BasicEvent<{
    resource: MaybeNull<IResource>;
    openType: MaybeNull<IEditorOpenType>;
    editorUri?: MaybeNull<URI>;
}> {
}
export interface IEditorGroupChangePayload {
    group: IEditorGroup;
    oldResource: MaybeNull<IResource>;
    newResource: MaybeNull<IResource>;
    oldOpenType: MaybeNull<IEditorOpenType>;
    newOpenType: MaybeNull<IEditorOpenType>;
}
export declare class EditorGroupFileDropEvent extends BasicEvent<IEditorGroupFileDropPayload> {
}
export interface IEditorGroupFileDropPayload {
    files: FileList;
    group: IEditorGroup;
    /**
     * 如果目标在tab上, drop目标tab的位置
     * -1表示在tab的空位置
     */
    tabIndex?: number;
    /**
     * 如果扔在编辑器主体，扔的位置
     */
    position?: DragOverPosition;
}
export interface IEditorDecorationCollectionService {
    createTextEditorDecorationType(options: IDecorationRenderOptions, key?: string): IBrowserTextEditorDecorationType;
    getTextEditorDecorationType(key: any): IBrowserTextEditorDecorationType | undefined;
    registerDecorationProvider(provider: IEditorDecorationProvider): IDisposable;
    getDecorationFromProvider(uri: URI, key?: string): Promise<{
        [key: string]: editor.IModelDeltaDecoration[];
    }>;
}
export interface IBrowserTextEditorDecorationType extends ITextEditorDecorationType {
    property: IDynamicModelDecorationProperty;
}
export interface IDynamicModelDecorationProperty extends IDisposable {
    default: IThemedCssStyle;
    light: IThemedCssStyle | null;
    dark: IThemedCssStyle | null;
    rangeBehavior?: TrackedRangeStickiness;
    overviewRulerLane?: OverviewRulerLane;
    isWholeLine: boolean;
}
export interface IThemedCssStyle extends IDisposable {
    glyphMarginClassName?: string;
    className?: string;
    inlineClassName?: string;
    afterContentClassName?: string;
    beforeContentClassName?: string;
    overviewRulerColor?: string | IThemeColor;
}
export declare const IEditorDecorationCollectionService: unique symbol;
export declare class EditorSelectionChangeEvent extends BasicEvent<IEditorSelectionChangeEventPayload> {
}
export interface IEditorSelectionChangeEventPayload {
    group: IEditorGroup;
    resource: IResource;
    selections: ISelection[];
    source: string | undefined;
    editorUri: URI;
    side?: 'original' | 'modified';
}
export declare class EditorVisibleChangeEvent extends BasicEvent<IEditorVisibleChangeEventPayload> {
}
export interface IEditorVisibleChangeEventPayload {
    group: IEditorGroup;
    resource: IResource;
    visibleRanges: IRange[];
    editorUri: URI;
}
export declare class EditorConfigurationChangedEvent extends BasicEvent<IEditorConfigurationChangedEventPayload> {
}
export interface IEditorConfigurationChangedEventPayload {
    group: IEditorGroup;
    resource: IResource;
    editorUri: URI;
}
export declare class EditorGroupIndexChangedEvent extends BasicEvent<IEditorGroupIndexChangeEventPayload> {
}
export interface IEditorGroupIndexChangeEventPayload {
    group: IEditorGroup;
    index: number;
}
export declare class EditorGroupsResetSizeEvent extends BasicEvent<void> {
}
export declare class RegisterEditorSideComponentEvent extends BasicEvent<void> {
}
export interface IEditorDecorationProvider {
    schemes?: string[];
    key: string;
    provideEditorDecoration(uri: URI): MaybePromise<editor.IModelDeltaDecoration[] | undefined>;
    onDidDecorationChange: Event<URI>;
}
export declare class EditorDecorationProviderRegistrationEvent extends BasicEvent<IEditorDecorationProvider> {
}
export declare class EditorDecorationChangeEvent extends BasicEvent<{
    uri: URI;
    key: string;
}> {
}
export declare class EditorDecorationTypeRemovedEvent extends BasicEvent<string> {
}
export interface IEditorActionRegistry {
    /**
     * 请不要再使用,暂时除了tip相关和isVisible仍然兼容
     * @deprecated
     * @param
     */
    registerEditorAction(action: IEditorActionItem): IDisposable;
    getMenu(group: IEditorGroup): IContextMenu;
}
export interface IEditorActionItem {
    title: string;
    iconClass: string;
    tip?: string;
    tipWhen?: string;
    tipClass?: string;
    /**
     * @deprecated 现在无效
     */
    isVisible?: (resource: MaybeNull<IResource>, editorGroup: IEditorGroup) => boolean;
    /**
     * @deprecated 现在会自动转为临时command
     */
    onClick: (resource: MaybeNull<IResource>, editorGroup: IEditorGroup) => void;
    when?: string;
}
export interface IVisibleAction {
    item: IEditorActionItem;
    tipVisible: boolean;
    closeTip(): void;
}
export declare const IEditorActionRegistry: unique symbol;
export interface ICompareService {
    /**
     * 在编辑器中compare两个文件
     */
    compare(original: URI, modified: URI, name: string): Promise<CompareResult>;
}
export declare const ICompareService: unique symbol;
export declare enum CompareResult {
    revert = "revert",
    accept = "accept",
    cancel = "cancel"
}
export interface IBreadCrumbService {
    registerBreadCrumbProvider(provider: IBreadCrumbProvider): IDisposable;
    getBreadCrumbs(uri: URI, editor?: MaybeNull<IEditor>, editorGroup?: EditorGroup): IBreadCrumbPart[] | undefined;
    disposeCrumb(uri: URI): void;
    onDidUpdateBreadCrumbResults: Event<{
        editor: MaybeNull<IEditor>;
        uri: URI;
    }>;
}
export declare const IBreadCrumbService: unique symbol;
export interface IBreadCrumbProvider {
    handlesUri(URI: URI): boolean;
    provideBreadCrumbForUri(uri: URI, editor?: MaybeNull<IEditor>): IBreadCrumbPart[];
    onDidUpdateBreadCrumb: Event<URI>;
}
export interface IBreadCrumbPart {
    name: string;
    icon?: string;
    uri?: URI;
    isSymbol?: boolean;
    getSiblings?(): MaybePromise<{
        parts: IBreadCrumbPart[];
        currentIndex: number;
    }>;
    getChildren?(): MaybePromise<IBreadCrumbPart[]>;
    onClick?(): void;
}
export declare const IEditorFeatureRegistry: unique symbol;
export interface IEditorFeatureRegistry {
    /**
     * 注册一个用来加强编辑器能力的Contribution
     * @param contribution
     */
    registerEditorFeatureContribution(contribution: IEditorFeatureContribution): IDisposable;
    /**
     * 运行 contrbute
     */
    runContributions(editor: IEditor): void;
    /**
     * 运行 provideEditorOptionsForUri
     */
    runProvideEditorOptionsForUri(uri: URI): MaybePromise<editor.IEditorOptions>;
}
export interface IConvertedMonacoOptions {
    editorOptions: Partial<editor.IEditorOptions>;
    modelOptions: Partial<editor.ITextModelUpdateOptions>;
    diffOptions: Partial<editor.IDiffEditorOptions>;
}
export interface IEditorFeatureContribution {
    /**
     * 当一个编辑器被创建时，会调用这个API，返回的Disposable会在编辑器被销毁时执行
     * @param editor
     */
    contribute(editor: IEditor): IDisposable;
    /**
     * 用来对 uri 进行 options 的修改
     * @param editor
     */
    provideEditorOptionsForUri?(uri: URI): MaybePromise<Partial<editor.IEditorOptions>>;
}
export declare class ResourceOpenTypeChangedEvent extends BasicEvent<URI> {
}
export declare class EditorComponentDisposeEvent extends BasicEvent<IEditorComponent> {
}
export declare class CodeEditorDidVisibleEvent extends BasicEvent<{
    type: EditorOpenType.code | EditorOpenType.diff;
    groupName: string;
    editorId: string;
}> {
}
//# sourceMappingURL=types.d.ts.map