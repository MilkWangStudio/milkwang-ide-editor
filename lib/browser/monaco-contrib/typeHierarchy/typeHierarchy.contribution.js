"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeHierarchyContribution = exports.executeProvideSubtypesCommand = exports.executeProvideSupertypesCommand = exports.executePrepareTypeHierarchyCommand = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const raw_context_key_1 = require("@opensumi/ide-core-browser/lib/raw-context-key");
const typeHierarchy_1 = require("@opensumi/ide-monaco/lib/browser/contrib/typeHierarchy");
const types_1 = require("../../types");
exports.executePrepareTypeHierarchyCommand = {
    id: '_executePrepareTypeHierarchy',
};
exports.executeProvideSupertypesCommand = {
    id: '_executeProvideSupertypes',
};
exports.executeProvideSubtypesCommand = {
    id: '_executeProvideSubtypes',
};
const _ctxHasCallHierarchyProvider = new raw_context_key_1.RawContextKey('editorHasCallHierarchyProvider', false);
let TypeHierarchyContribution = class TypeHierarchyContribution {
    registerCommands(commands) {
        commands.registerCommand(exports.executePrepareTypeHierarchyCommand, {
            execute: (resource, position) => this.typeHierarchyService.prepareTypeHierarchyProvider(resource, position),
        });
        commands.registerCommand(exports.executeProvideSupertypesCommand, {
            execute: (item) => this.typeHierarchyService.provideSupertypes(item),
        });
        commands.registerCommand(exports.executeProvideSubtypesCommand, {
            execute: (item) => this.typeHierarchyService.provideSubtypes(item),
        });
    }
    registerEditorFeature(registry) {
        this.ctxHasProvider = _ctxHasCallHierarchyProvider.bind(this.contextKeyService);
        registry.registerEditorFeatureContribution({
            contribute: (editor) => {
                const monacoEditor = editor.monacoEditor;
                return ide_core_browser_1.Event.any(monacoEditor.onDidChangeModel, monacoEditor.onDidChangeModelLanguage, typeHierarchy_1.TypeHierarchyProviderRegistry.onDidChange)(() => {
                    if (monacoEditor.hasModel()) {
                        this.ctxHasProvider.set(typeHierarchy_1.TypeHierarchyProviderRegistry.has(monacoEditor.getModel()));
                    }
                });
            },
        });
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.IContextKeyService),
    tslib_1.__metadata("design:type", Object)
], TypeHierarchyContribution.prototype, "contextKeyService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(typeHierarchy_1.ITypeHierarchyService),
    tslib_1.__metadata("design:type", Object)
], TypeHierarchyContribution.prototype, "typeHierarchyService", void 0);
TypeHierarchyContribution = tslib_1.__decorate([
    (0, ide_core_browser_1.Domain)(ide_core_browser_1.CommandContribution, types_1.BrowserEditorContribution)
], TypeHierarchyContribution);
exports.TypeHierarchyContribution = TypeHierarchyContribution;
//# sourceMappingURL=typeHierarchy.contribution.js.map