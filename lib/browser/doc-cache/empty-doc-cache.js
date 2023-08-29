"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmptyDocCacheImpl = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
/**
 * 一个空的，什么都不做的缓存对象，提供一个空的缓存对象实现
 */
let EmptyDocCacheImpl = class EmptyDocCacheImpl {
    hasCache(_uri) {
        return false;
    }
    isFlushed() {
        return true;
    }
    getCache(_uri) {
        return null;
    }
    persistCache(_uri, _status) {
        // nothing
    }
};
EmptyDocCacheImpl = tslib_1.__decorate([
    (0, di_1.Injectable)()
], EmptyDocCacheImpl);
exports.EmptyDocCacheImpl = EmptyDocCacheImpl;
//# sourceMappingURL=empty-doc-cache.js.map