"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallHierarchyContribution = exports.executeProvideOutgoingCallsCommand = exports.executeProvideIncomingCallsCommand = exports.executePrepareCallHierarchyCommand = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const raw_context_key_1 = require("@opensumi/ide-core-browser/lib/raw-context-key");
const callHierarchy_1 = require("@opensumi/ide-monaco/lib/browser/contrib/callHierarchy");
const types_1 = require("../../types");
exports.executePrepareCallHierarchyCommand = {
    id: '_executePrepareCallHierarchy',
};
exports.executeProvideIncomingCallsCommand = {
    id: '_executeProvideIncomingCalls',
};
exports.executeProvideOutgoingCallsCommand = {
    id: '_executeProvideOutgoingCalls',
};
const _ctxHasCallHierarchyProvider = new raw_context_key_1.RawContextKey('editorHasCallHierarchyProvider', false);
let CallHierarchyContribution = class CallHierarchyContribution {
    registerCommands(commands) {
        commands.registerCommand(exports.executePrepareCallHierarchyCommand, {
            execute: (resource, position) => this.callHierarchyService.prepareCallHierarchyProvider(resource, position),
        });
        commands.registerCommand(exports.executeProvideIncomingCallsCommand, {
            execute: (item) => this.callHierarchyService.provideIncomingCalls(item),
        });
        commands.registerCommand(exports.executeProvideOutgoingCallsCommand, {
            execute: (item) => this.callHierarchyService.provideOutgoingCalls(item),
        });
    }
    registerEditorFeature(registry) {
        this.ctxHasProvider = _ctxHasCallHierarchyProvider.bind(this.contextKeyService);
        registry.registerEditorFeatureContribution({
            contribute: (editor) => {
                const monacoEditor = editor.monacoEditor;
                return ide_core_browser_1.Event.any(monacoEditor.onDidChangeModel, monacoEditor.onDidChangeModelLanguage, callHierarchy_1.CallHierarchyProviderRegistry.onDidChange)(() => {
                    if (monacoEditor.hasModel()) {
                        this.ctxHasProvider.set(callHierarchy_1.CallHierarchyProviderRegistry.has(monacoEditor.getModel()));
                    }
                });
            },
        });
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.IContextKeyService),
    tslib_1.__metadata("design:type", Object)
], CallHierarchyContribution.prototype, "contextKeyService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(callHierarchy_1.ICallHierarchyService),
    tslib_1.__metadata("design:type", Object)
], CallHierarchyContribution.prototype, "callHierarchyService", void 0);
CallHierarchyContribution = tslib_1.__decorate([
    (0, ide_core_browser_1.Domain)(ide_core_browser_1.CommandContribution, types_1.BrowserEditorContribution)
], CallHierarchyContribution);
exports.CallHierarchyContribution = CallHierarchyContribution;
//# sourceMappingURL=callHierarchy.contribution.js.map