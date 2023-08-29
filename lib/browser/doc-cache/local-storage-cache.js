"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStorageDocCacheImpl = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_workspace_1 = require("@opensumi/ide-workspace");
const doc_cache_1 = require("../../common/doc-cache");
/**
 * 使用 LocalStorage 实现的文档缓存对象
 */
let LocalStorageDocCacheImpl = class LocalStorageDocCacheImpl {
    hasCache(_uri) {
        return true;
    }
    /**
     * LocalStorage 的存储都是瞬间完成的，始终返回 true
     */
    isFlushed() {
        return true;
    }
    /**
     * 从 LocalStorage 获取缓存数据，
     * 因为底层对象设计是异步的，所以这里也是异步的，实际上是立即返回的
     * @param uri
     */
    async getCache(uri) {
        const key = this.parseKeyFrom(uri);
        const result = await this.storageService.getData(key);
        return result || null;
    }
    /**
     * 持久化缓存对象到 LocalStorage 中
     * @param uri
     * @param status
     */
    persistCache(uri, status) {
        const key = this.parseKeyFrom(uri);
        const cache = this.parseCacheFrom(uri, status);
        this.storageService.setData(key, cache);
    }
    /**
     * 从文档状态解析缓存对象
     * @param status
     */
    parseCacheFrom(uri, status) {
        if (!status.dirty || !status.changeMatrix.length) {
            return undefined;
        }
        return {
            path: uri.path.toString(),
            startMD5: status.startMD5,
            changeMatrix: status.changeMatrix.map((changes) => changes.map((change) => (0, doc_cache_1.parseCacheValueFrom)(change))),
        };
    }
    parseKeyFrom(uri) {
        return `LocalStorageDocCacheImpl_${uri.toString()}`;
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_workspace_1.IWorkspaceStorageService),
    tslib_1.__metadata("design:type", Object)
], LocalStorageDocCacheImpl.prototype, "storageService", void 0);
LocalStorageDocCacheImpl = tslib_1.__decorate([
    (0, di_1.Injectable)()
], LocalStorageDocCacheImpl);
exports.LocalStorageDocCacheImpl = LocalStorageDocCacheImpl;
//# sourceMappingURL=local-storage-cache.js.map