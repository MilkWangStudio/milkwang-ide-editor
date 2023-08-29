"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemResourceContribution = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const types_1 = require("../types");
const fs_editor_doc_1 = require("./fs-editor-doc");
const fs_resource_1 = require("./fs-resource");
let FileSystemResourceContribution = class FileSystemResourceContribution {
    registerResource(registry) {
        registry.registerResourceProvider(this.fsResourceProvider);
    }
    registerEditorDocumentModelContentProvider(registry) {
        registry.registerEditorDocumentModelContentProvider(this.fsDocProvider);
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(fs_resource_1.FileSystemResourceProvider),
    tslib_1.__metadata("design:type", fs_resource_1.FileSystemResourceProvider)
], FileSystemResourceContribution.prototype, "fsResourceProvider", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(fs_editor_doc_1.BaseFileSystemEditorDocumentProvider),
    tslib_1.__metadata("design:type", fs_editor_doc_1.BaseFileSystemEditorDocumentProvider)
], FileSystemResourceContribution.prototype, "fsDocProvider", void 0);
FileSystemResourceContribution = tslib_1.__decorate([
    (0, ide_core_browser_1.Domain)(types_1.BrowserEditorContribution)
], FileSystemResourceContribution);
exports.FileSystemResourceContribution = FileSystemResourceContribution;
//# sourceMappingURL=index.js.map