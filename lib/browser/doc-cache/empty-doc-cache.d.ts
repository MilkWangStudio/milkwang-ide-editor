import { URI } from '@opensumi/ide-core-browser';
import { IDocPersistentCacheProvider, IDocStatus } from '../../common/doc-cache';
/**
 * 一个空的，什么都不做的缓存对象，提供一个空的缓存对象实现
 */
export declare class EmptyDocCacheImpl implements IDocPersistentCacheProvider {
    hasCache(_uri: URI): boolean;
    isFlushed(): boolean;
    getCache(_uri: URI): null;
    persistCache(_uri: URI, _status: IDocStatus): void;
}
//# sourceMappingURL=empty-doc-cache.d.ts.map