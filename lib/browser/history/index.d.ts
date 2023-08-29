import { IPosition, URI, WithEventBus } from '@opensumi/ide-core-browser';
import { EditorSelectionChangeEvent, EditorGroupChangeEvent, EditorGroupCloseEvent } from '../types';
export declare class EditorHistoryService extends WithEventBus {
    private static readonly MOUSE_NAVIGATION_SETTING;
    private preferenceService;
    private editorService;
    private currentIndex;
    private stack;
    private closedStack;
    init(): void;
    private registerMouseNavigationListener;
    private onMouseDown;
    onEditorSelectionChangeEvent(e: EditorSelectionChangeEvent): void;
    onEditorGroupChangeEvent(e: EditorGroupChangeEvent): void;
    onEditorGroupCloseEvent(e: EditorGroupCloseEvent): void;
    onNewState(state: EditorHistoryState): void;
    get currentState(): EditorHistoryState;
    doPushState(state: EditorHistoryState, isRelevant: boolean): void;
    forward(): void;
    back(): void;
    restoreState(state: EditorHistoryState): void;
    pushClosed(uri: URI): void;
    popClosed(): void;
}
export declare class EditorHistoryState {
    readonly uri: URI;
    readonly position: IPosition;
    groupIndex: number;
    isTabChange: boolean;
    constructor(uri: URI, position: IPosition, groupIndex: number, isTabChange: boolean);
    isRelevant(anotherState: EditorHistoryState): boolean;
    isEqual(anotherState: EditorHistoryState): boolean;
}
//# sourceMappingURL=index.d.ts.map