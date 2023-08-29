"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorPreferenceContribution = void 0;
const tslib_1 = require("tslib");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const schema_1 = require("./schema");
let EditorPreferenceContribution = class EditorPreferenceContribution {
    constructor() {
        this.schema = schema_1.editorPreferenceSchema;
    }
};
EditorPreferenceContribution = tslib_1.__decorate([
    (0, ide_core_browser_1.Domain)(ide_core_browser_1.PreferenceContribution)
], EditorPreferenceContribution);
exports.EditorPreferenceContribution = EditorPreferenceContribution;
//# sourceMappingURL=contribution.js.map