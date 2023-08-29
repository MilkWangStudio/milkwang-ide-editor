"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ORIGINAL_DOC_SCHEME = exports.EditorDocumentModelWillSaveEvent = exports.EditorDocumentModelSavedEvent = exports.EditorDocumentModelRemovalEvent = exports.EditorDocumentModelCreationEvent = exports.EditorDocumentModelOptionExternalUpdatedEvent = exports.EditorDocumentModelOptionChangedEvent = exports.EditorDocumentModelContentChangedEvent = exports.IEditorDocumentModelContentRegistry = exports.IEditorDocumentModelService = void 0;
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
exports.IEditorDocumentModelService = Symbol('IEditorDocumentModelService');
exports.IEditorDocumentModelContentRegistry = Symbol('IEditorDocumentModelContentRegistry');
// events;
class EditorDocumentModelContentChangedEvent extends ide_core_browser_1.BasicEvent {
}
exports.EditorDocumentModelContentChangedEvent = EditorDocumentModelContentChangedEvent;
class EditorDocumentModelOptionChangedEvent extends ide_core_browser_1.BasicEvent {
}
exports.EditorDocumentModelOptionChangedEvent = EditorDocumentModelOptionChangedEvent;
class EditorDocumentModelOptionExternalUpdatedEvent extends ide_core_browser_1.BasicEvent {
}
exports.EditorDocumentModelOptionExternalUpdatedEvent = EditorDocumentModelOptionExternalUpdatedEvent;
class EditorDocumentModelCreationEvent extends ide_core_browser_1.BasicEvent {
}
exports.EditorDocumentModelCreationEvent = EditorDocumentModelCreationEvent;
class EditorDocumentModelRemovalEvent extends ide_core_browser_1.BasicEvent {
}
exports.EditorDocumentModelRemovalEvent = EditorDocumentModelRemovalEvent;
class EditorDocumentModelSavedEvent extends ide_core_browser_1.BasicEvent {
}
exports.EditorDocumentModelSavedEvent = EditorDocumentModelSavedEvent;
class EditorDocumentModelWillSaveEvent extends ide_core_browser_1.BasicEvent {
}
exports.EditorDocumentModelWillSaveEvent = EditorDocumentModelWillSaveEvent;
// original_doc://?target=file://aaa.js
exports.ORIGINAL_DOC_SCHEME = 'original_doc';
//# sourceMappingURL=types.js.map