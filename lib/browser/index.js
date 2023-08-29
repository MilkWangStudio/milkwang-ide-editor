"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorClientAppContribution = exports.EditorModule = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const callHierarchy_1 = require("@opensumi/ide-monaco/lib/browser/contrib/callHierarchy");
const command_1 = require("@opensumi/ide-monaco/lib/browser/contrib/command");
const tokenizer_1 = require("@opensumi/ide-monaco/lib/browser/contrib/tokenizer");
const typeHierarchy_1 = require("@opensumi/ide-monaco/lib/browser/contrib/typeHierarchy");
const common_1 = require("../common");
const doc_cache_1 = require("../common/doc-cache");
const breadcrumb_1 = require("./breadcrumb");
const component_1 = require("./component");
const diff_1 = require("./diff");
const compare_1 = require("./diff/compare");
const doc_cache_2 = require("./doc-cache");
const main_1 = require("./doc-model/main");
const saveParticipants_1 = require("./doc-model/saveParticipants");
const types_1 = require("./doc-model/types");
const editor_collection_service_1 = require("./editor-collection.service");
const editor_electron_contribution_1 = require("./editor-electron.contribution");
const editor_contribution_1 = require("./editor.contribution");
const editor_decoration_service_1 = require("./editor.decoration.service");
const feature_1 = require("./feature");
const fs_resource_1 = require("./fs-resource");
const language_status_contribution_1 = require("./language/language-status.contribution");
const language_status_service_1 = require("./language/language-status.service");
const language_service_1 = require("./language/language.service");
const editor_menu_1 = require("./menu/editor.menu");
const open_type_menu_contribution_1 = require("./menu/open-type-menu.contribution");
const merge_editor_contribution_1 = require("./merge-editor/merge-editor.contribution");
const monaco_contrib_1 = require("./monaco-contrib");
const command_service_1 = require("./monaco-contrib/command/command.service");
const textmate_service_1 = require("./monaco-contrib/tokenizer/textmate.service");
const contribution_1 = require("./preference/contribution");
const schema_1 = require("./preference/schema");
const resource_service_1 = require("./resource.service");
const types_2 = require("./types");
const workbench_editor_service_1 = require("./workbench-editor.service");
tslib_1.__exportStar(require("./preference/schema"), exports);
tslib_1.__exportStar(require("./types"), exports);
tslib_1.__exportStar(require("./doc-model/types"), exports);
tslib_1.__exportStar(require("./doc-cache"), exports);
tslib_1.__exportStar(require("./editor.less"), exports);
tslib_1.__exportStar(require("./view/editor.react"), exports);
let EditorModule = class EditorModule extends ide_core_browser_1.BrowserModule {
    constructor() {
        super(...arguments);
        this.providers = [
            {
                token: common_1.EditorCollectionService,
                useClass: editor_collection_service_1.EditorCollectionServiceImpl,
            },
            {
                token: common_1.WorkbenchEditorService,
                useClass: workbench_editor_service_1.WorkbenchEditorServiceImpl,
            },
            {
                token: common_1.ResourceService,
                useClass: resource_service_1.ResourceServiceImpl,
            },
            {
                token: types_2.EditorComponentRegistry,
                useClass: component_1.EditorComponentRegistryImpl,
            },
            {
                token: types_2.IEditorDecorationCollectionService,
                useClass: editor_decoration_service_1.EditorDecorationCollectionService,
            },
            {
                token: types_1.IEditorDocumentModelContentRegistry,
                useClass: main_1.EditorDocumentModelContentRegistryImpl,
            },
            {
                token: types_1.IEditorDocumentModelService,
                useClass: main_1.EditorDocumentModelServiceImpl,
            },
            {
                token: common_1.ILanguageService,
                useClass: language_service_1.LanguageService,
            },
            {
                token: types_2.IEditorActionRegistry,
                useClass: editor_menu_1.EditorActionRegistryImpl,
            },
            {
                token: doc_cache_1.IDocPersistentCacheProvider,
                useClass: doc_cache_2.EmptyDocCacheImpl,
                // useClass: LocalStorageDocCacheImpl,
            },
            {
                token: types_2.ICompareService,
                useClass: compare_1.CompareService,
            },
            {
                token: types_2.IBreadCrumbService,
                useClass: breadcrumb_1.BreadCrumbServiceImpl,
            },
            {
                token: types_2.IEditorFeatureRegistry,
                useClass: feature_1.EditorFeatureRegistryImpl,
            },
            {
                token: schema_1.EditorPreferences,
                useFactory: (inject) => {
                    const preferences = inject.get(ide_core_browser_1.PreferenceService);
                    return (0, ide_core_browser_1.createPreferenceProxy)(preferences, schema_1.editorPreferenceSchema);
                },
            },
            {
                token: callHierarchy_1.ICallHierarchyService,
                useClass: monaco_contrib_1.CallHierarchyService,
            },
            {
                token: typeHierarchy_1.ITypeHierarchyService,
                useClass: monaco_contrib_1.TypeHierarchyService,
            },
            {
                token: command_1.ICommandServiceToken,
                useClass: command_service_1.MonacoCommandService,
            },
            {
                token: command_1.IMonacoCommandsRegistry,
                useClass: command_service_1.MonacoCommandRegistry,
            },
            {
                token: command_1.IMonacoActionRegistry,
                useClass: command_service_1.MonacoActionRegistry,
            },
            {
                token: tokenizer_1.ITextmateTokenizer,
                useClass: textmate_service_1.TextmateService,
            },
            {
                token: types_2.ILanguageStatusService,
                useClass: language_status_service_1.LanguageStatusService,
            },
            contribution_1.EditorPreferenceContribution,
            diff_1.DefaultDiffEditorContribution,
            merge_editor_contribution_1.MergeEditorContribution,
            EditorClientAppContribution,
            editor_contribution_1.EditorContribution,
            compare_1.CompareEditorContribution,
            editor_contribution_1.EditorAutoSaveEditorContribution,
            saveParticipants_1.SaveParticipantsContribution,
            fs_resource_1.FileSystemResourceContribution,
            monaco_contrib_1.CallHierarchyContribution,
            monaco_contrib_1.TypeHierarchyContribution,
            language_status_contribution_1.LanguageStatusContribution,
            open_type_menu_contribution_1.OpenTypeMenuContribution,
        ];
        this.electronProviders = [editor_electron_contribution_1.EditorElectronContribution];
        this.contributionProvider = types_2.BrowserEditorContribution;
    }
};
EditorModule = tslib_1.__decorate([
    (0, di_1.Injectable)()
], EditorModule);
exports.EditorModule = EditorModule;
let EditorClientAppContribution = class EditorClientAppContribution {
    async initialize() {
        for (const contribution of this.contributions.getContributions()) {
            if (contribution.registerResource) {
                contribution.registerResource(this.resourceService);
            }
            if (contribution.registerEditorComponent) {
                contribution.registerEditorComponent(this.editorComponentRegistry);
            }
            if (contribution.registerEditorDocumentModelContentProvider) {
                contribution.registerEditorDocumentModelContentProvider(this.modelContentRegistry);
            }
            if (contribution.registerEditorActions) {
                contribution.registerEditorActions(this.editorActionRegistry);
            }
            if (contribution.registerEditorFeature) {
                contribution.registerEditorFeature(this.editorFeatureRegistry);
            }
        }
        this.workbenchEditorService.contributionsReady.resolve();
        await Promise.all([this.workbenchEditorService.initialize(), this.modelService.initialize()]);
    }
    async onDidStart() {
        this.workbenchEditorService.prepareContextKeyService();
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(),
    tslib_1.__metadata("design:type", common_1.ResourceService)
], EditorClientAppContribution.prototype, "resourceService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(),
    tslib_1.__metadata("design:type", types_2.EditorComponentRegistry)
], EditorClientAppContribution.prototype, "editorComponentRegistry", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(common_1.WorkbenchEditorService),
    tslib_1.__metadata("design:type", workbench_editor_service_1.WorkbenchEditorServiceImpl)
], EditorClientAppContribution.prototype, "workbenchEditorService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(types_1.IEditorDocumentModelContentRegistry),
    tslib_1.__metadata("design:type", Object)
], EditorClientAppContribution.prototype, "modelContentRegistry", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(types_2.IEditorActionRegistry),
    tslib_1.__metadata("design:type", Object)
], EditorClientAppContribution.prototype, "editorActionRegistry", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(types_2.IEditorFeatureRegistry),
    tslib_1.__metadata("design:type", Object)
], EditorClientAppContribution.prototype, "editorFeatureRegistry", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(di_1.INJECTOR_TOKEN),
    tslib_1.__metadata("design:type", di_1.Injector)
], EditorClientAppContribution.prototype, "injector", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(types_1.IEditorDocumentModelService),
    tslib_1.__metadata("design:type", main_1.EditorDocumentModelServiceImpl)
], EditorClientAppContribution.prototype, "modelService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(types_2.BrowserEditorContribution),
    tslib_1.__metadata("design:type", Object)
], EditorClientAppContribution.prototype, "contributions", void 0);
EditorClientAppContribution = tslib_1.__decorate([
    (0, ide_core_browser_1.Domain)(ide_core_browser_1.ClientAppContribution)
], EditorClientAppContribution);
exports.EditorClientAppContribution = EditorClientAppContribution;
//# sourceMappingURL=index.js.map