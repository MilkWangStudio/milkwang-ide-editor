"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentFormatService = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_common_1 = require("@opensumi/ide-core-common");
const languages_1 = require("@opensumi/ide-monaco/lib/browser/monaco-api/languages");
const range_1 = require("@opensumi/monaco-editor-core/esm/vs/editor/common/core/range");
const format_1 = require("@opensumi/monaco-editor-core/esm/vs/editor/contrib/format/browser/format");
const formattingEdit_1 = require("@opensumi/monaco-editor-core/esm/vs/editor/contrib/format/browser/formattingEdit");
const types_1 = require("../types");
const workbench_editor_service_1 = require("../workbench-editor.service");
const formatterSelect_1 = require("./formatterSelect");
let DocumentFormatService = class DocumentFormatService {
    async formatDocumentWith() {
        var _a, _b;
        const model = (_a = this.workbenchEditorService.currentEditor) === null || _a === void 0 ? void 0 : _a.monacoEditor.getModel();
        if (model) {
            const formatterProviders = (0, format_1.getRealAndSyntheticDocumentFormattersOrdered)(languages_1.languageFeaturesService.documentFormattingEditProvider, languages_1.languageFeaturesService.documentRangeFormattingEditProvider, model);
            const selector = this.injector.get(formatterSelect_1.FormattingSelector);
            const formatter = await selector.select(formatterProviders, model, format_1.FormattingMode.Explicit, true);
            if (formatter) {
                try {
                    const edits = await formatter.provideDocumentFormattingEdits(model, model.getFormattingOptions(), ide_core_common_1.CancellationToken.None);
                    if (edits) {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        formattingEdit_1.FormattingEdit.execute((_b = this.workbenchEditorService.currentEditor) === null || _b === void 0 ? void 0 : _b.monacoEditor, edits, true);
                    }
                }
                catch (err) {
                    this.logger.error('execute format document with error', err);
                }
            }
        }
    }
    async formatSelectionWith() {
        var _a, _b, _c, _d;
        if (!((_a = this.workbenchEditorService.currentEditor) === null || _a === void 0 ? void 0 : _a.monacoEditor.hasModel())) {
            return;
        }
        const model = (_b = this.workbenchEditorService.currentEditor) === null || _b === void 0 ? void 0 : _b.monacoEditor.getModel();
        if (model) {
            let range = (_c = this.workbenchEditorService.currentEditor) === null || _c === void 0 ? void 0 : _c.monacoEditor.getSelection();
            if (range === null || range === void 0 ? void 0 : range.isEmpty()) {
                range = new range_1.Range(range.startLineNumber, 1, range.startLineNumber, model.getLineMaxColumn(range.startLineNumber));
            }
            const formatterProviders = languages_1.languageFeaturesService.documentRangeFormattingEditProvider.ordered(model);
            const selector = this.injector.get(formatterSelect_1.FormattingSelector);
            const formatter = await selector.select(formatterProviders, model, format_1.FormattingMode.Explicit, true);
            if (formatter) {
                try {
                    const edits = await formatter.provideDocumentRangeFormattingEdits(model, range, model.getFormattingOptions(), ide_core_common_1.CancellationToken.None);
                    if (edits) {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        formattingEdit_1.FormattingEdit.execute((_d = this.workbenchEditorService.currentEditor) === null || _d === void 0 ? void 0 : _d.monacoEditor, edits, true);
                    }
                }
                catch (err) {
                    this.logger.error('execute format document with error', err);
                }
            }
        }
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_common_1.ILogger),
    tslib_1.__metadata("design:type", Object)
], DocumentFormatService.prototype, "logger", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(types_1.WorkbenchEditorService),
    tslib_1.__metadata("design:type", workbench_editor_service_1.WorkbenchEditorServiceImpl)
], DocumentFormatService.prototype, "workbenchEditorService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(di_1.INJECTOR_TOKEN),
    tslib_1.__metadata("design:type", di_1.Injector)
], DocumentFormatService.prototype, "injector", void 0);
DocumentFormatService = tslib_1.__decorate([
    (0, di_1.Injectable)()
], DocumentFormatService);
exports.DocumentFormatService = DocumentFormatService;
//# sourceMappingURL=format.service.js.map