import { IDisposable, IEventBus, MaybeNull, Emitter } from '@opensumi/ide-core-browser';
import { IEditorGroup, IEditorGroupState, Direction } from '../../common';
export declare const editorGridUid: Set<unknown>;
export declare class EditorGrid implements IDisposable {
    parent?: EditorGrid | undefined;
    editorGroup: IGridEditorGroup | null;
    children: EditorGrid[];
    splitDirection: SplitDirection | undefined;
    protected readonly _onDidGridStateChange: Emitter<void>;
    readonly onDidGridStateChange: import("@opensumi/ide-core-browser").Event<void>;
    protected readonly _onDidGridAndDesendantStateChange: Emitter<void>;
    readonly onDidGridAndDesendantStateChange: import("@opensumi/ide-core-browser").Event<void>;
    readonly uid: string;
    constructor(parent?: EditorGrid | undefined);
    setEditorGroup(editorGroup: IGridEditorGroup): void;
    private generateSplitParent;
    private generateSplitSibling;
    split(direction: SplitDirection, editorGroup: IGridEditorGroup, before?: boolean): void;
    dispose(): void;
    replaceBy(target: EditorGrid): void;
    emitResizeWithEventBus(eventBus: IEventBus): void;
    serialize(): IEditorGridState | null;
    deserialize(state: IEditorGridState, editorGroupFactory: () => IGridEditorGroup, editorGroupRestoreStatePromises: Promise<any>[]): Promise<any>;
    findGird(direction: Direction, currentIndex?: number): MaybeNull<EditorGrid>;
    getFirstLeaf(): MaybeNull<EditorGrid>;
    sortEditorGroups(results: IEditorGroup[]): void;
    move(direction: Direction): void;
}
export interface IEditorGridState {
    editorGroup?: IEditorGroupState;
    splitDirection?: SplitDirection;
    children?: IEditorGridState[];
}
export interface IGridChild {
    grid: EditorGrid;
    percentage: number;
}
export declare enum SplitDirection {
    Horizontal = 1,
    Vertical = 2
}
export interface IGridEditorGroup extends IEditorGroup {
    grid: EditorGrid;
}
export declare function splitDirectionMatches(split: SplitDirection, direction: Direction): boolean;
//# sourceMappingURL=grid.service.d.ts.map