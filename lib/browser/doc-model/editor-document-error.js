"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorDocumentError = void 0;
var EditorDocumentError;
(function (EditorDocumentError) {
    // 读取缓存异常
    EditorDocumentError["READ_CACHE_ERROR"] = "EditorDocumentError:READ_CACHE_ERROR";
    // 在应用缓存内容之前，编辑器发生了内容变化
    EditorDocumentError["APPLY_CACHE_TO_DIRTY_DOCUMENT"] = "EditorDocumentError:APPLY_CACHE_TO_DIRTY_DOCUMENT";
    // 在应用缓存内容到一个不匹配的文档版本，通常发生在 MD5 计算不一样的时候
    EditorDocumentError["APPLY_CACHE_TO_DIFFERENT_DOCUMENT"] = "EditorDocumentError:APPLY_CACHE_TO_DIFFERENT_DOCUMENT";
    // Format 失败
    EditorDocumentError["FORMAT_ERROR"] = "EditorDocumentError:FORMAT_ERROR";
})(EditorDocumentError = exports.EditorDocumentError || (exports.EditorDocumentError = {}));
//# sourceMappingURL=editor-document-error.js.map