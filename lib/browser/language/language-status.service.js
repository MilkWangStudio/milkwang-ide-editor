"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageStatusService = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_common_1 = require("@opensumi/ide-core-common");
const languageFeatureRegistry_1 = require("@opensumi/monaco-editor-core/esm/vs/editor/common/languageFeatureRegistry");
const { compare } = ide_core_common_1.strings;
let LanguageStatusService = class LanguageStatusService {
    constructor() {
        this._provider = new languageFeatureRegistry_1.LanguageFeatureRegistry();
        this.onDidChange = this._provider.onDidChange;
    }
    addStatus(status) {
        return this._provider.register(status.selector, status);
    }
    getLanguageStatus(model) {
        return this._provider.ordered(model).sort((a, b) => {
            let res = b.severity - a.severity;
            if (res === 0) {
                res = compare(a.source, b.source);
            }
            if (res === 0) {
                res = compare(a.id, b.id);
            }
            return res;
        });
    }
};
LanguageStatusService = tslib_1.__decorate([
    (0, di_1.Injectable)()
], LanguageStatusService);
exports.LanguageStatusService = LanguageStatusService;
//# sourceMappingURL=language-status.service.js.map