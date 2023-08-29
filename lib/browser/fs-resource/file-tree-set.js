"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileTreeSet = exports.FileTreeNode = void 0;
/**
 * 对于 tree-like 的结构，希望父节点被删除/更新时，能影响到子节点
 */
class FileTreeNode {
    get children() {
        if (!this._children) {
            this._children = new Map();
        }
        return this._children;
    }
    constructor(path, parent, separator = '/') {
        this.path = path;
        this.parent = parent;
        this.separator = separator;
        this._disposed = false;
        if (parent) {
            this.key = parent.key + this.separator + path;
        }
        else {
            this.key = path;
        }
    }
    bindOnDispose(callback) {
        this._onDisposed = callback;
    }
    addChild(path) {
        const node = new FileTreeNode(path, this, this.separator);
        this.children.set(path, node);
        return node;
    }
    getAllDescendants() {
        if (!this._children) {
            return [this];
        }
        else {
            const result = [this];
            this.children.forEach((c) => {
                result.push(...c.getAllDescendants());
            });
            return result;
        }
    }
    dispose() {
        if (this._disposed) {
            return;
        }
        if (this.parent) {
            this.parent.children.delete(this.path);
            if (this.parent.children.size === 0) {
                this.parent.dispose();
            }
        }
        if (this._onDisposed) {
            this._onDisposed();
        }
        this._disposed = true;
    }
}
exports.FileTreeNode = FileTreeNode;
class FileTreeSet {
    constructor(isWindows = false) {
        this.nodes = new Map();
        this.separator = isWindows ? '\\' : '/';
    }
    add(path) {
        const segments = path.split(this.separator);
        let p;
        let currentNode;
        for (const seg of segments) {
            if (p === undefined) {
                p = seg;
            }
            else {
                p += this.separator + seg;
            }
            let node;
            if (this.nodes.has(p)) {
                node = this.nodes.get(p);
            }
            else {
                if (currentNode) {
                    node = currentNode.addChild(seg);
                }
                else {
                    node = new FileTreeNode(seg, undefined, this.separator);
                }
                node.bindOnDispose(() => {
                    this.nodes.delete(node.key);
                });
                this.nodes.set(node.key, node);
            }
            currentNode = node;
        }
    }
    /**
     * 返回所有被影响的子节点
     * @param path
     */
    delete(path) {
        const effected = this.effects(path);
        effected.forEach((e) => {
            const node = this.nodes.get(e);
            if (node) {
                node.dispose();
            }
        });
        return effected;
    }
    effects(path) {
        const target = this.nodes.get(path);
        if (!target) {
            return [];
        }
        else {
            return target.getAllDescendants().map((n) => n.key);
        }
    }
}
exports.FileTreeSet = FileTreeSet;
//# sourceMappingURL=file-tree-set.js.map