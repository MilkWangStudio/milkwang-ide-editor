import { URI } from '@opensumi/ide-core-common';
import { IDocPersistentCacheProvider, IDocStatus, IDocCache } from '../../common/doc-cache';
/**
 * 使用 LocalStorage 实现的文档缓存对象
 */
export declare class LocalStorageDocCacheImpl implements IDocPersistentCacheProvider {
    private storageService;
    hasCache(_uri: URI): boolean;
    /**
     * LocalStorage 的存储都是瞬间完成的，始终返回 true
     */
    isFlushed(): boolean;
    /**
     * 从 LocalStorage 获取缓存数据，
     * 因为底层对象设计是异步的，所以这里也是异步的，实际上是立即返回的
     * @param uri
     */
    getCache(uri: URI): Promise<IDocCache | null>;
    /**
     * 持久化缓存对象到 LocalStorage 中
     * @param uri
     * @param status
     */
    persistCache(uri: URI, status: IDocStatus): void;
    /**
     * 从文档状态解析缓存对象
     * @param status
     */
    private parseCacheFrom;
    private parseKeyFrom;
}
//# sourceMappingURL=local-storage-cache.d.ts.map