"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEditorError = exports.EditorTabChangedError = exports.EditorError = void 0;
class EditorError extends Error {
}
exports.EditorError = EditorError;
class EditorTabChangedError extends EditorError {
    constructor() {
        super('editor current tab changed when opening resource');
        this.type = EditorTabChangedError.errorCode;
    }
}
exports.EditorTabChangedError = EditorTabChangedError;
EditorTabChangedError.errorCode = 1001;
function isEditorError(e, type) {
    return e && e.type === type.errorCode;
}
exports.isEditorError = isEditorError;
//# sourceMappingURL=error.js.map