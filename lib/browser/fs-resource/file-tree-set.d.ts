/**
 * 对于 tree-like 的结构，希望父节点被删除/更新时，能影响到子节点
 */
export declare class FileTreeNode {
    readonly path: string;
    readonly parent?: FileTreeNode | undefined;
    private separator;
    readonly key: string;
    private _children;
    private _disposed;
    private _onDisposed;
    private get children();
    constructor(path: string, parent?: FileTreeNode | undefined, separator?: string);
    bindOnDispose(callback: () => void): void;
    addChild(path: string): FileTreeNode;
    getAllDescendants(): FileTreeNode[];
    dispose(): void;
}
export declare class FileTreeSet<T = any> {
    private separator;
    constructor(isWindows?: boolean);
    private nodes;
    add<T>(path: string): void;
    /**
     * 返回所有被影响的子节点
     * @param path
     */
    delete(path: string): string[];
    effects(path: string): string[];
}
//# sourceMappingURL=file-tree-set.d.ts.map