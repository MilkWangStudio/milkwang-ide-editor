"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEditorPreferenceProxy = void 0;
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const schema_1 = require("./schema");
function createEditorPreferenceProxy(preferenceService, resourceUri, overrideIdentifier) {
    return (0, ide_core_browser_1.createPreferenceProxy)(preferenceService, schema_1.editorPreferenceSchema, {
        resourceUri,
        overrideIdentifier,
    });
}
exports.createEditorPreferenceProxy = createEditorPreferenceProxy;
//# sourceMappingURL=util.js.map