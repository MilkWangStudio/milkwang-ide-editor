"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRangeFrom = exports.parseCacheValueFrom = exports.isDocChangesCache = exports.isDocContentCache = exports.IDocPersistentCacheProvider = void 0;
const range_1 = require("@opensumi/monaco-editor-core/esm/vs/editor/common/core/range");
exports.IDocPersistentCacheProvider = Symbol('IDocPersistentCacheProvider');
function isDocContentCache(cache) {
    return cache.hasOwnProperty('content');
}
exports.isDocContentCache = isDocContentCache;
function isDocChangesCache(cache) {
    return cache.hasOwnProperty('changeMatrix');
}
exports.isDocChangesCache = isDocChangesCache;
function parseCacheValueFrom(change) {
    const text = change.text;
    const startLineNumber = change.range.startLineNumber;
    const startColumn = change.range.startColumn;
    const endLineNumber = change.range.endLineNumber;
    const endColumn = change.range.endColumn;
    return [text, startLineNumber, startColumn, endLineNumber, endColumn];
}
exports.parseCacheValueFrom = parseCacheValueFrom;
function parseRangeFrom(cacheValue) {
    const [_text, startLineNumber, startColumn, endLineNumber, endColumn] = cacheValue;
    return range_1.Range.lift({
        startLineNumber,
        startColumn,
        endLineNumber,
        endColumn,
    });
}
exports.parseRangeFrom = parseRangeFrom;
//# sourceMappingURL=doc-cache.js.map