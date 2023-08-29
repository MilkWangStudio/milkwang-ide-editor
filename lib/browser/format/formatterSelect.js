"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormattingSelector = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const format_1 = require("@opensumi/monaco-editor-core/esm/vs/editor/contrib/format/browser/format");
const types_1 = require("../doc-model/types");
let FormattingSelector = class FormattingSelector {
    async select(formatters, document, mode, forceSelect = false) {
        const docRef = this.modelService.getModelReference(ide_core_browser_1.URI.from(document.uri.toJSON()));
        if (!docRef) {
            return;
        }
        const languageId = docRef.instance.languageId;
        docRef.dispose();
        let preferred;
        if (!forceSelect) {
            preferred = (this.preferenceService.get('editor.preferredFormatter') || {})[languageId];
        }
        const elements = {};
        formatters.forEach((provider) => {
            if (provider.extensionId) {
                elements[provider.extensionId] = provider;
            }
        });
        if (preferred && !forceSelect) {
            const idx = formatters.findIndex((provider) => provider.extensionId === preferred);
            if (idx >= 0) {
                return formatters[idx];
            }
        }
        else if (formatters.length < 2 && !forceSelect) {
            return formatters[0];
        }
        if (mode === format_1.FormattingMode.Explicit) {
            const selected = await this.quickPickService.show(Object.keys(elements).map((k) => ({
                label: elements[k].displayName,
                value: elements[k].extensionId,
            })), { placeholder: (0, ide_core_browser_1.localize)('editor.format.chooseFormatter') });
            if (selected) {
                const config = this.preferenceService.get('editor.preferredFormatter') || {};
                this.preferenceService.set('editor.preferredFormatter', Object.assign(Object.assign({}, config), { [languageId]: selected }), ide_core_browser_1.PreferenceScope.User);
                return elements[selected];
            }
        }
        else {
            return undefined;
        }
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.QuickPickService),
    tslib_1.__metadata("design:type", Object)
], FormattingSelector.prototype, "quickPickService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.PreferenceService),
    tslib_1.__metadata("design:type", Object)
], FormattingSelector.prototype, "preferenceService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(types_1.IEditorDocumentModelService),
    tslib_1.__metadata("design:type", Object)
], FormattingSelector.prototype, "modelService", void 0);
FormattingSelector = tslib_1.__decorate([
    (0, di_1.Injectable)()
], FormattingSelector);
exports.FormattingSelector = FormattingSelector;
//# sourceMappingURL=formatterSelect.js.map