"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEOLStack = exports.isEditStack = void 0;
function isEditStack(element) {
    return !!element.editOperations;
}
exports.isEditStack = isEditStack;
function isEOLStack(element) {
    return !!element.eol;
}
exports.isEOLStack = isEOLStack;
//# sourceMappingURL=editor-is-fn.js.map