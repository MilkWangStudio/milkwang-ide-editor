"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorAutoSaveEditorContribution = exports.EditorContribution = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const layout_1 = require("@opensumi/ide-core-browser/lib/layout");
const next_1 = require("@opensumi/ide-core-browser/lib/menu/next");
const menu_interface_1 = require("@opensumi/ide-core-browser/lib/menu/next/menu.interface");
const base_1 = require("@opensumi/ide-core-browser/lib/menu/next/renderer/ctxmenu/base");
const merge_editor_widget_1 = require("@opensumi/ide-core-browser/lib/monaco/merge-editor-widget");
const ide_core_common_1 = require("@opensumi/ide-core-common");
const electron_1 = require("@opensumi/ide-core-common/lib/electron");
const merge_editor_service_1 = require("@opensumi/ide-monaco/lib/browser/contrib/merge-editor/merge-editor.service");
const tokenizer_1 = require("@opensumi/ide-monaco/lib/browser/contrib/tokenizer");
const editorContextKeys_1 = require("@opensumi/monaco-editor-core/esm/vs/editor/common/editorContextKeys");
const monaco = tslib_1.__importStar(require("@opensumi/monaco-editor-core/esm/vs/editor/editor.api"));
const contextkey_1 = require("@opensumi/monaco-editor-core/esm/vs/platform/contextkey/common/contextkey");
const descriptors_1 = require("@opensumi/monaco-editor-core/esm/vs/platform/instantiation/common/descriptors");
const common_1 = require("../common");
const editor_1 = require("../common/editor");
const override_1 = require("./doc-model/override");
const types_1 = require("./doc-model/types");
const types_2 = require("./doc-model/types");
const editor_opener_1 = require("./editor-opener");
const editor_override_1 = require("./editor.override");
const editor_status_bar_service_1 = require("./editor.status-bar.service");
const editor_view_1 = require("./editor.view");
const format_service_1 = require("./format/format.service");
const formatterSelect_1 = require("./format/formatterSelect");
const history_1 = require("./history");
const editor_context_1 = require("./menu/editor.context");
const navigation_view_1 = require("./navigation.view");
const go_to_line_1 = require("./quick-open/go-to-line");
const workspace_symbol_quickopen_1 = require("./quick-open/workspace-symbol-quickopen");
const types_3 = require("./types");
const suggest_widget_1 = require("./view/suggest-widget");
const topPadding_1 = require("./view/topPadding");
const workbench_editor_service_1 = require("./workbench-editor.service");
let EditorContribution = class EditorContribution {
    registerComponent(registry) {
        registry.register('@opensumi/ide-editor', {
            id: 'ide-editor',
            component: editor_view_1.EditorView,
        });
        registry.register('breadcrumb-menu', {
            id: 'breadcrumb-menu',
            component: navigation_view_1.NavigationMenuContainer,
        });
    }
    registerOverrideService(registry) {
        const codeEditorService = this.injector.get(editor_override_1.MonacoCodeService);
        // Monaco Editor ContextKeyService
        // 经过这个Override, 所有编辑器的 contextKeyService 都是 editorContextKeyService 的孩子
        const globalContextKeyService = this.injector.get(ide_core_browser_1.IContextKeyService);
        const editorContextKeyService = globalContextKeyService.createScoped();
        this.workbenchEditorService.setEditorContextKeyService(editorContextKeyService);
        registry.registerOverrideService(ide_core_browser_1.ServiceNames.CONTEXT_KEY_SERVICE, editorContextKeyService.contextKeyService);
        // Monaco CodeEditorService
        registry.registerOverrideService(ide_core_browser_1.ServiceNames.CODE_EDITOR_SERVICE, codeEditorService);
        // Monaco ContextViewService
        registry.registerOverrideService(ide_core_browser_1.ServiceNames.CONTEXT_VIEW_SERVICE, new editor_override_1.MonacoContextViewService(codeEditorService));
        // Monaco TextModelService
        registry.registerOverrideService(ide_core_browser_1.ServiceNames.TEXT_MODEL_SERVICE, this.injector.get(override_1.MonacoTextModelService));
    }
    registerMonacoDefaultFormattingSelector(register) {
        const formatSelector = this.injector.get(formatterSelect_1.FormattingSelector);
        register(formatSelector.select.bind(formatSelector));
    }
    registerEditorExtensionContribution(register) {
        register(editor_context_1.EditorContextMenuController.ID, 
        /**
         * 如果使用 common-di 的 Injectable 装饰，在内部会无法被 monaco 实例化
         * 这里借用 monaco 内置的 DI 注入方式，将依赖的 Services 通过参数传递进去
         * 在内部重新实例化时会拼接两份参数，对于 EditorContextMenuController
         * monaco 将会自动补充另一个 editor 实例作为参数
         * ref: https://github.com/microsoft/vscode/blob/3820f34dcabb3060715e24abfd05ec2455e71786/src/vs/platform/instantiation/common/instantiationService.ts#L73
         */
        new descriptors_1.SyncDescriptor(editor_context_1.EditorContextMenuController, [
            this.contextMenuService,
            this.globalContextKeyService,
            this.contextMenuRenderer,
        ]));
    }
    getMimeForMode(langId) {
        for (const language of this.textmateService.getLanguages()) {
            if (language.id === langId && language.mimetypes) {
                return language.mimetypes[0];
            }
        }
        return undefined;
    }
    registerPlatformLanguageAssociations(register) {
        const association = this.corePreferences['files.associations'];
        if (!association) {
            return;
        }
        const mimeAssociation = Object.keys(association).map((filepattern) => ({
            id: association[filepattern],
            filepattern,
            mime: this.getMimeForMode(association[filepattern]) || `text/x-${association.id}`,
        }));
        register(mimeAssociation);
    }
    async interceptOpen(uri) {
        try {
            await this.openerService.open(uri);
            return true;
        }
        catch (e) {
            this.logger.error(e);
            return false;
        }
    }
    onWillStop(app) {
        if (!this.appConfig.isElectronRenderer) {
            return this.workbenchEditorService.hasDirty() || !this.cacheProvider.isFlushed();
        }
    }
    // editorTitle出现了参数不统一。。
    extractGroupAndUriFromArgs(resource, editorGroup) {
        let group;
        let uri;
        if (resource instanceof ide_core_browser_1.URI) {
            group = editorGroup || this.workbenchEditorService.currentEditorGroup;
            uri = resource || (group && group.currentResource && group.currentResource.uri);
        }
        else {
            const resourceArgs = resource || {};
            group = resourceArgs.group || this.workbenchEditorService.currentEditorGroup;
            uri = resourceArgs.uri || (group && group.currentResource && group.currentResource.uri);
        }
        return {
            group,
            uri,
        };
    }
    isElectronRenderer() {
        return this.appConfig.isElectronRenderer;
    }
    registerKeybindings(keybindings) {
        keybindings.registerKeybinding({
            command: ide_core_browser_1.EDITOR_COMMANDS.SAVE_CURRENT.id,
            keybinding: 'ctrlcmd+s',
        });
        keybindings.registerKeybinding({
            command: ide_core_browser_1.EDITOR_COMMANDS.FOCUS_IF_NOT_ACTIVATE_ELEMENT.id,
            keybinding: 'ctrlcmd+f',
            when: '!editorFocus',
        });
        keybindings.registerKeybinding({
            command: ide_core_browser_1.EDITOR_COMMANDS.CLOSE.id,
            keybinding: this.isElectronRenderer() ? 'ctrlcmd+w' : 'alt+shift+w',
        });
        keybindings.registerKeybinding({
            command: ide_core_browser_1.EDITOR_COMMANDS.PREVIOUS.id,
            keybinding: this.isElectronRenderer() ? 'alt+cmd+left' : 'ctrlcmd+ctrl+left',
        });
        keybindings.registerKeybinding({
            command: ide_core_browser_1.EDITOR_COMMANDS.NEXT.id,
            keybinding: this.isElectronRenderer() ? 'alt+cmd+right' : 'ctrlcmd+ctrl+right',
        });
        keybindings.registerKeybinding({
            command: ide_core_browser_1.EDITOR_COMMANDS.PREVIOUS.id,
            keybinding: this.isElectronRenderer() ? 'ctrlcmd+pageup' : 'alt+pageup',
        });
        keybindings.registerKeybinding({
            command: ide_core_browser_1.EDITOR_COMMANDS.NEXT.id,
            keybinding: this.isElectronRenderer() ? 'ctrlcmd+pagedown' : 'alt+pagedown',
        });
        keybindings.registerKeybinding({
            command: ide_core_browser_1.EDITOR_COMMANDS.GO_FORWARD.id,
            keybinding: ide_core_common_1.isWindows ? 'alt+right' : 'ctrl+shift+-',
        });
        keybindings.registerKeybinding({
            command: ide_core_browser_1.EDITOR_COMMANDS.GO_BACK.id,
            keybinding: ide_core_common_1.isWindows ? 'alt+left' : 'ctrl+-',
        });
        keybindings.registerKeybinding({
            command: ide_core_browser_1.EDITOR_COMMANDS.CHANGE_LANGUAGE.id,
            keybinding: 'ctrlcmd+k m',
        });
        keybindings.registerKeybinding({
            command: ide_core_browser_1.EDITOR_COMMANDS.SPLIT_TO_RIGHT.id,
            keybinding: 'ctrlcmd+\\',
        });
        keybindings.registerKeybinding({
            command: ide_core_browser_1.EDITOR_COMMANDS.NAVIGATE_NEXT.id,
            keybinding: 'ctrlcmd+k ctrlcmd+right',
        });
        keybindings.registerKeybinding({
            command: ide_core_browser_1.EDITOR_COMMANDS.NAVIGATE_PREVIOUS.id,
            keybinding: 'ctrlcmd+k ctrlcmd+left',
        });
        keybindings.registerKeybinding({
            command: ide_core_browser_1.EDITOR_COMMANDS.SAVE_ALL.id,
            keybinding: 'alt+ctrlcmd+s',
        });
        keybindings.registerKeybinding({
            command: ide_core_browser_1.EDITOR_COMMANDS.CLOSE_ALL_IN_GROUP.id,
            keybinding: 'ctrlcmd+k w',
        });
        keybindings.registerKeybinding({
            command: ide_core_browser_1.EDITOR_COMMANDS.CLOSE_ALL.id,
            keybinding: 'ctrlcmd+k ctrlcmd+w',
        });
        keybindings.registerKeybinding({
            command: ide_core_browser_1.EDITOR_COMMANDS.CLOSE_SAVED.id,
            keybinding: 'ctrlcmd+k u',
        });
        keybindings.registerKeybinding({
            command: ide_core_browser_1.EDITOR_COMMANDS.PIN_CURRENT.id,
            keybinding: 'ctrlcmd+k enter',
        });
        keybindings.registerKeybinding({
            command: ide_core_browser_1.EDITOR_COMMANDS.COPY_CURRENT_PATH.id,
            keybinding: 'ctrlcmd+k p',
        });
        keybindings.registerKeybinding({
            command: ide_core_browser_1.EDITOR_COMMANDS.REOPEN_CLOSED.id,
            keybinding: this.isElectronRenderer() ? 'ctrlcmd+shift+t' : 'alt+shift+t',
        });
        keybindings.registerKeybinding({
            command: ide_core_browser_1.EDITOR_COMMANDS.NEW_UNTITLED_FILE.id,
            keybinding: this.isElectronRenderer() ? 'ctrlcmd+n' : 'alt+n',
        });
        keybindings.registerKeybinding({
            command: ide_core_browser_1.EDITOR_COMMANDS.SEARCH_WORKSPACE_SYMBOL.id,
            keybinding: this.isElectronRenderer() ? 'ctrlcmd+t' : 'ctrlcmd+o',
        });
        keybindings.registerKeybinding({
            command: ide_core_browser_1.EDITOR_COMMANDS.SEARCH_WORKSPACE_SYMBOL_CLASS.id,
            keybinding: this.isElectronRenderer() ? 'ctrlcmd+alt+t' : 'ctrlcmd+alt+o',
        });
        for (let i = 1; i < 10; i++) {
            keybindings.registerKeybinding({
                command: ide_core_browser_1.EDITOR_COMMANDS.GO_TO_GROUP.id,
                keybinding: 'ctrlcmd+' + i,
                args: [i],
            });
        }
        ['left', 'up', 'down', 'right'].forEach((direction) => {
            keybindings.registerKeybinding({
                command: ide_core_browser_1.EDITOR_COMMANDS.MOVE_GROUP.id,
                keybinding: 'ctrlcmd+k ' + direction,
                args: [direction],
            });
        });
        // The native `undo/redo` capability is retained in the native Input
        keybindings.registerKeybinding({
            command: ide_core_browser_1.EDITOR_COMMANDS.COMPONENT_UNDO.id,
            keybinding: 'ctrlcmd+z',
            when: 'inEditorComponent && !inputFocus',
        });
        keybindings.registerKeybinding({
            command: ide_core_browser_1.EDITOR_COMMANDS.COMPONENT_REDO.id,
            keybinding: 'shift+ctrlcmd+z',
            when: 'inEditorComponent && !inputFocus',
        });
        keybindings.registerKeybinding({
            command: ide_core_browser_1.EDITOR_COMMANDS.TOGGLE_WORD_WRAP.id,
            keybinding: 'alt+z',
            when: 'editorFocus',
        });
    }
    initialize() {
        this.editorStatusBarService.setListener();
        this.historyService.init();
    }
    registerCommands(commands) {
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.GO_FORWARD, {
            execute: () => {
                this.historyService.forward();
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.FOCUS_IF_NOT_ACTIVATE_ELEMENT, {
            execute: () => {
                var _a, _b;
                if (!document.activeElement || document.activeElement === document.body) {
                    const group = this.workbenchEditorService.currentEditorGroup;
                    group === null || group === void 0 ? void 0 : group.focus();
                    (_b = (_a = group === null || group === void 0 ? void 0 : group.currentCodeEditor) === null || _a === void 0 ? void 0 : _a.monacoEditor) === null || _b === void 0 ? void 0 : _b.trigger('api', 'actions.find', null);
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.GO_BACK, {
            execute: () => {
                this.historyService.back();
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.OPEN_RESOURCE, {
            execute: async (uri, options) => {
                const openResult = await this.workbenchEditorService.open(uri, options);
                if (openResult) {
                    return {
                        groupId: openResult === null || openResult === void 0 ? void 0 : openResult.group.name,
                    };
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.OPEN_RESOURCES, {
            execute: ({ uris }) => {
                this.workbenchEditorService.openUris(uris);
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.COMPARE, {
            execute: ({ original, modified, name }, options = {}) => {
                name = name || `${original.displayName} <=> ${modified.displayName}`;
                return this.workbenchEditorService.open(ide_core_browser_1.URI.from({
                    scheme: 'diff',
                    query: ide_core_browser_1.URI.stringifyQuery({
                        name,
                        original,
                        modified,
                    }),
                }), options);
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.OPEN_MERGEEDITOR, {
            execute: (args) => {
                const validatedArgs = merge_editor_widget_1.IRelaxedOpenMergeEditorArgs.validate(args);
                this.workbenchEditorService.open(ide_core_browser_1.URI.from({
                    scheme: 'mergeEditor',
                    query: ide_core_browser_1.URI.stringifyQuery({
                        name: (0, ide_core_browser_1.formatLocalize)('mergeEditor.workbench.tab.name', validatedArgs.output.displayName),
                        openMetadata: merge_editor_widget_1.IRelaxedOpenMergeEditorArgs.toString(validatedArgs),
                    }),
                }));
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.MERGEEDITOR_RESET, {
            execute: () => {
                const nutrition = this.mergeEditorService.getNutrition();
                if (!nutrition) {
                    return;
                }
                const { output } = nutrition;
                const { uri } = output;
                // 重置状态
                this.mergeEditorService.fireRestoreState(uri);
                // 然后再重新 compare
                this.mergeEditorService.compare();
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.SAVE_CURRENT, {
            execute: async () => {
                const group = this.workbenchEditorService.currentEditorGroup;
                if (group && group.currentResource) {
                    group.pin(group.currentResource.uri);
                    group.saveCurrent();
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.SAVE_URI, {
            execute: async (uri) => {
                for (const g of this.workbenchEditorService.editorGroups) {
                    const r = g.resources.find((r) => r.uri.isEqual(uri));
                    if (r) {
                        g.saveResource(r);
                    }
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.CLOSE_ALL_IN_GROUP, {
            execute: async (args0, args1) => {
                const { group } = this.extractGroupAndUriFromArgs(args0, args1);
                if (group) {
                    await group.closeAll();
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.CLOSE_SAVED, {
            execute: async (resource) => {
                resource = resource || {};
                const { group = this.workbenchEditorService.currentEditorGroup } = resource;
                if (group) {
                    await group.closeSaved();
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.CLOSE_OTHER_IN_GROUP, {
            execute: async (resource) => {
                resource = resource || {};
                const { group = this.workbenchEditorService.currentEditorGroup, uri = group && group.currentResource && group.currentResource.uri, } = resource;
                if (group && uri) {
                    await group.closeOthers(uri);
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.CLOSE, {
            execute: async (resource) => {
                resource = resource || {};
                const { group = this.workbenchEditorService.currentEditorGroup, uri = group && group.currentResource && group.currentResource.uri, } = resource;
                if (group && uri) {
                    await group.close(uri);
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.CLOSE_TO_RIGHT, {
            execute: async (resource) => {
                resource = resource || {};
                const { group = this.workbenchEditorService.currentEditorGroup, uri = group && group.currentResource && group.currentResource.uri, } = resource;
                if (group && uri) {
                    await group.closeToRight(uri);
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.GET_CURRENT, {
            execute: () => this.workbenchEditorService.currentEditorGroup,
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.GET_CURRENT_RESOURCE, {
            execute: () => this.workbenchEditorService.currentResource,
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.PIN_CURRENT, {
            execute: () => {
                const group = this.workbenchEditorService.currentEditorGroup;
                if (group) {
                    group.pinPreviewed();
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.COPY_CURRENT_PATH, {
            execute: () => {
                const resource = this.workbenchEditorService.currentResource;
                if (resource && resource.uri.scheme === ide_core_browser_1.Schemes.file) {
                    this.clipboardService.writeText(resource.uri.codeUri.fsPath);
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.SPLIT_TO_LEFT, {
            execute: async (resource) => {
                resource = resource || {};
                const { group = this.workbenchEditorService.currentEditorGroup, uri = group && group.currentResource && group.currentResource.uri, } = resource;
                if (group && uri) {
                    await group.split(common_1.EditorGroupSplitAction.Left, uri, { focus: true });
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.SPLIT_TO_RIGHT, {
            execute: async (resource, editorGroup) => {
                const { group, uri } = this.extractGroupAndUriFromArgs(resource, editorGroup);
                if (group && uri) {
                    await group.split(common_1.EditorGroupSplitAction.Right, uri, { focus: true });
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.GO_TO_GROUP, {
            execute: async (index = 1) => {
                var _a;
                const group = this.workbenchEditorService.sortedEditorGroups[index - 1];
                if (group) {
                    group.focus();
                    return;
                }
                // 如果找的索引比 editorGroups 的数量大1，就向右拆分一个
                const groupLength = this.workbenchEditorService.sortedEditorGroups.length;
                if (groupLength === index - 1) {
                    const rightEditorGroup = this.workbenchEditorService.sortedEditorGroups[groupLength - 1];
                    const uri = (_a = rightEditorGroup === null || rightEditorGroup === void 0 ? void 0 : rightEditorGroup.currentResource) === null || _a === void 0 ? void 0 : _a.uri;
                    if (rightEditorGroup && uri) {
                        await rightEditorGroup.split(common_1.EditorGroupSplitAction.Right, uri, { focus: true });
                    }
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.MOVE_GROUP, {
            execute: async (direction) => {
                if (direction) {
                    const group = this.workbenchEditorService.currentEditorGroup;
                    if (group) {
                        group.grid.move(direction);
                    }
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.FOCUS_ACTIVE_EDITOR_GROUP, {
            execute: async () => {
                const group = this.workbenchEditorService.currentEditorGroup;
                if (group) {
                    group.focus();
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.SPLIT_TO_TOP, {
            execute: async (resource) => {
                resource = resource || {};
                const { group = this.workbenchEditorService.currentEditorGroup, uri = group && group.currentResource && group.currentResource.uri, } = resource;
                if (group && uri) {
                    await group.split(common_1.EditorGroupSplitAction.Top, uri, { focus: true });
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.SPLIT_TO_BOTTOM, {
            execute: async (resource) => {
                resource = resource || {};
                const { group = this.workbenchEditorService.currentEditorGroup, uri = group && group.currentResource && group.currentResource.uri, } = resource;
                if (group && uri) {
                    await group.split(common_1.EditorGroupSplitAction.Bottom, uri, { focus: true });
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.CHANGE_LANGUAGE, {
            execute: async (currentLanguageId) => {
                const allLanguages = this.languagesService.languages;
                const allLanguageItems = allLanguages.map((language) => ({
                    label: language.name,
                    value: language.id,
                    description: `(${language.id})`,
                }));
                const targetLanguageId = await this.quickPickService.show(allLanguageItems, {
                    placeholder: (0, ide_core_browser_1.localize)('editor.changeLanguageId'),
                    selectIndex: () => allLanguageItems.findIndex((item) => { var _a, _b; return item.value === ((_b = (_a = this.workbenchEditorService.currentCodeEditor) === null || _a === void 0 ? void 0 : _a.currentDocumentModel) === null || _b === void 0 ? void 0 : _b.languageId); }),
                });
                if (targetLanguageId && currentLanguageId !== targetLanguageId) {
                    if (this.workbenchEditorService.currentEditor) {
                        const currentDocModel = this.workbenchEditorService.currentEditor.currentDocumentModel;
                        if (currentDocModel) {
                            this.editorDocumentModelService.changeModelOptions(currentDocModel.uri, {
                                languageId: targetLanguageId,
                            });
                        }
                    }
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.CHANGE_ENCODING, {
            execute: async () => {
                var _a, _b;
                // TODO: 这里应该和 vscode 一样，可以 通过编码打开 和 通过编码保存
                // 但目前的磁盘文件对比使用的是文件字符串 md5 对比，导致更改编码时必定触发 diff，因此编码保存无法生效
                // 长期看 md5 应该更改为 mtime 和 size 才更可靠
                const resource = this.workbenchEditorService.currentResource;
                const documentModel = (_a = this.workbenchEditorService.currentEditor) === null || _a === void 0 ? void 0 : _a.currentDocumentModel;
                if (!resource || !documentModel) {
                    return;
                }
                const configuredEncoding = this.preferenceService.get('files.encoding', 'utf8', resource.uri.toString(), (0, ide_core_browser_1.getLanguageIdFromMonaco)(resource.uri));
                const provider = await this.contentRegistry.getProvider(resource.uri);
                const guessedEncoding = await ((_b = provider === null || provider === void 0 ? void 0 : provider.guessEncoding) === null || _b === void 0 ? void 0 : _b.call(provider, resource.uri));
                const currentEncoding = documentModel.encoding;
                let matchIndex;
                const encodingItems = Object.keys(ide_core_browser_1.SUPPORTED_ENCODINGS)
                    .sort((k1, k2) => {
                    if (k1 === configuredEncoding) {
                        return -1;
                    }
                    else if (k2 === configuredEncoding) {
                        return 1;
                    }
                    return ide_core_browser_1.SUPPORTED_ENCODINGS[k1].order - ide_core_browser_1.SUPPORTED_ENCODINGS[k2].order;
                })
                    .filter((k) => {
                    // 猜测的编码和配置的编码不一致不现实，单独在最上方显示
                    if (k === guessedEncoding && guessedEncoding !== configuredEncoding) {
                        return false;
                    }
                    return !ide_core_browser_1.SUPPORTED_ENCODINGS[k].encodeOnly; // 对于只用于 encode 编码不展示
                })
                    .map((key, index) => {
                    if (key === currentEncoding || ide_core_browser_1.SUPPORTED_ENCODINGS[key].alias === currentEncoding) {
                        matchIndex = index;
                    }
                    return { label: ide_core_browser_1.SUPPORTED_ENCODINGS[key].labelLong, value: key, description: key };
                });
                // Insert guessed encoding
                if (guessedEncoding && configuredEncoding !== guessedEncoding && ide_core_browser_1.SUPPORTED_ENCODINGS[guessedEncoding]) {
                    if (encodingItems[0]) {
                        encodingItems[0].showBorder = true;
                    }
                    encodingItems.unshift({
                        label: ide_core_browser_1.SUPPORTED_ENCODINGS[guessedEncoding].labelLong,
                        value: guessedEncoding,
                        description: (0, ide_core_browser_1.localize)('editor.guessEncodingFromContent'),
                    });
                    if (typeof matchIndex === 'number') {
                        matchIndex++;
                    }
                }
                const selectedFileEncoding = await this.quickPickService.show(encodingItems, {
                    placeholder: (0, ide_core_browser_1.localize)('editor.chooseEncoding'),
                    selectIndex(lookFor) {
                        if (!lookFor) {
                            return typeof matchIndex === 'number' ? matchIndex : -1;
                        }
                        return -1;
                    },
                });
                if (!selectedFileEncoding) {
                    return;
                }
                const uris = resource.uri.scheme === 'diff' ? [resource.metadata.original, resource.metadata.modified] : [resource.uri];
                uris.forEach((uri) => {
                    this.editorDocumentModelService.changeModelOptions(uri, {
                        encoding: selectedFileEncoding,
                    });
                });
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.CHANGE_EOL, {
            execute: async () => {
                const resource = this.workbenchEditorService.currentResource;
                const currentCodeEditor = this.workbenchEditorService.currentCodeEditor;
                if (currentCodeEditor && currentCodeEditor.currentDocumentModel && resource) {
                    const res = await this.quickPickService.show([
                        { label: 'LF', value: "\n" /* EOL.LF */ },
                        { label: 'CRLF', value: "\r\n" /* EOL.CRLF */ },
                    ], {
                        placeholder: (0, ide_core_browser_1.localize)('editor.changeEol'),
                        selectIndex: () => (currentCodeEditor.currentDocumentModel.eol === "\n" /* EOL.LF */ ? 0 : 1),
                    });
                    if (res) {
                        this.editorDocumentModelService.changeModelOptions(resource.uri, {
                            eol: res,
                        });
                    }
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.FOCUS, {
            execute: async () => {
                if (this.workbenchEditorService.currentEditor) {
                    this.workbenchEditorService.currentEditor.monacoEditor.focus();
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.NAVIGATE_NEXT, {
            execute: async () => {
                let i = this.workbenchEditorService.currentEditorGroup.index + 1;
                if (this.workbenchEditorService.editorGroups.length <= i) {
                    i = 0;
                }
                return this.workbenchEditorService.sortedEditorGroups[i].focus();
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.NAVIGATE_PREVIOUS, {
            execute: async () => {
                let i = this.workbenchEditorService.currentEditorGroup.index - 1;
                if (i < 0) {
                    i = this.workbenchEditorService.editorGroups.length - 1;
                }
                return this.workbenchEditorService.sortedEditorGroups[i].focus();
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.NAVIGATE_UP, {
            execute: async () => {
                const currentGrid = this.workbenchEditorService.currentEditorGroup.grid;
                const targetGrid = currentGrid.findGird(common_1.Direction.UP);
                if (targetGrid) {
                    return targetGrid.editorGroup.focus();
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.NAVIGATE_DOWN, {
            execute: async () => {
                const currentGrid = this.workbenchEditorService.currentEditorGroup.grid;
                const targetGrid = currentGrid.findGird(common_1.Direction.DOWN);
                if (targetGrid) {
                    return targetGrid.editorGroup.focus();
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.NAVIGATE_LEFT, {
            execute: async () => {
                const currentGrid = this.workbenchEditorService.currentEditorGroup.grid;
                const targetGrid = currentGrid.findGird(common_1.Direction.LEFT);
                if (targetGrid) {
                    return targetGrid.editorGroup.focus();
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.NAVIGATE_RIGHT, {
            execute: async () => {
                const currentGrid = this.workbenchEditorService.currentEditorGroup.grid;
                const targetGrid = currentGrid.findGird(common_1.Direction.RIGHT);
                if (targetGrid) {
                    return targetGrid.editorGroup.focus();
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.PREVIOUS_IN_GROUP, {
            execute: async () => {
                const editorGroup = this.workbenchEditorService.currentEditorGroup;
                if (!editorGroup.currentResource) {
                    return;
                }
                const index = editorGroup.resources.findIndex((r) => r.uri.isEqual(editorGroup.currentResource.uri)) - 1;
                if (editorGroup.resources[index]) {
                    return editorGroup.open(editorGroup.resources[index].uri, { focus: true });
                }
                else {
                    return editorGroup.open(editorGroup.resources[0].uri, { focus: true });
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.NEXT_IN_GROUP, {
            execute: async () => {
                const editorGroup = this.workbenchEditorService.currentEditorGroup;
                if (!editorGroup.currentResource) {
                    return;
                }
                const index = editorGroup.resources.findIndex((r) => r.uri.isEqual(editorGroup.currentResource.uri)) + 1;
                if (editorGroup.resources[index]) {
                    return editorGroup.open(editorGroup.resources[index].uri, { focus: true });
                }
                else {
                    return editorGroup.open(editorGroup.resources[editorGroup.resources.length - 1].uri, { focus: true });
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.NEXT, {
            execute: async () => {
                const editorGroup = this.workbenchEditorService.currentEditorGroup;
                if (!editorGroup.currentResource) {
                    return;
                }
                const index = editorGroup.resources.findIndex((r) => r.uri.isEqual(editorGroup.currentResource.uri)) + 1;
                if (editorGroup.resources[index]) {
                    return editorGroup.open(editorGroup.resources[index].uri, { focus: true });
                }
                else {
                    const nextEditorGroupIndex = editorGroup.index === this.workbenchEditorService.editorGroups.length - 1 ? 0 : editorGroup.index + 1;
                    const nextEditorGroup = this.workbenchEditorService.sortedEditorGroups[nextEditorGroupIndex];
                    nextEditorGroup.focus();
                    return nextEditorGroup.open(nextEditorGroup.resources[0].uri, { focus: true });
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.PREVIOUS, {
            execute: async () => {
                const editorGroup = this.workbenchEditorService.currentEditorGroup;
                if (!editorGroup.currentResource) {
                    return;
                }
                const index = editorGroup.resources.findIndex((r) => r.uri.isEqual(editorGroup.currentResource.uri)) - 1;
                if (editorGroup.resources[index]) {
                    return editorGroup.open(editorGroup.resources[index].uri, { focus: true });
                }
                else {
                    const nextEditorGroupIndex = editorGroup.index === 0 ? this.workbenchEditorService.editorGroups.length - 1 : editorGroup.index - 1;
                    const nextEditorGroup = this.workbenchEditorService.sortedEditorGroups[nextEditorGroupIndex];
                    nextEditorGroup.focus();
                    return nextEditorGroup.open(nextEditorGroup.resources[nextEditorGroup.resources.length - 1].uri, {
                        focus: true,
                    });
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.LAST_IN_GROUP, {
            execute: async () => {
                const editorGroup = this.workbenchEditorService.currentEditorGroup;
                if (editorGroup.resources.length > 0) {
                    return editorGroup.open(editorGroup.resources[editorGroup.resources.length - 1].uri, { focus: true });
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.EVEN_EDITOR_GROUPS, {
            execute: async () => {
                const eventBus = this.injector.get(ide_core_browser_1.IEventBus);
                eventBus.fire(new types_3.EditorGroupsResetSizeEvent());
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.CLOSE_OTHER_GROUPS, {
            execute: async () => {
                const editorGroup = this.workbenchEditorService.currentEditorGroup;
                const groupsToClose = this.workbenchEditorService.editorGroups.filter((e) => e !== editorGroup);
                groupsToClose.forEach((g) => {
                    g.dispose();
                });
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.OPEN_EDITOR_AT_INDEX, {
            execute: async (index) => {
                const editorGroup = this.workbenchEditorService.currentEditorGroup;
                const target = editorGroup.resources[index];
                if (target) {
                    await editorGroup.open(target.uri, { focus: true });
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.REVERT_DOCUMENT, {
            execute: async () => {
                const group = this.workbenchEditorService.currentEditorGroup;
                if (group.isCodeEditorMode()) {
                    const documentModel = group.codeEditor.currentDocumentModel;
                    if (documentModel) {
                        await documentModel.revert();
                    }
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.REVERT_AND_CLOSE, {
            execute: async () => {
                const group = this.workbenchEditorService.currentEditorGroup;
                if (group.isCodeEditorMode()) {
                    const documentModel = group.codeEditor.currentDocumentModel;
                    if (documentModel) {
                        await documentModel.revert();
                    }
                    group.close(group.currentResource.uri);
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.SAVE_ALL, {
            execute: async (reason) => {
                this.workbenchEditorService.saveAll(undefined, reason);
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.CLOSE_ALL, {
            execute: async (uri) => {
                this.workbenchEditorService.closeAll(uri);
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.REOPEN_CLOSED, {
            execute: async () => {
                this.historyService.popClosed();
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.NEW_UNTITLED_FILE, {
            execute: () => {
                this.workbenchEditorService.createUntitledResource();
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.COMPONENT_UNDO, {
            execute: () => {
                this.workbenchEditorService.currentEditorGroup.componentUndo();
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.COMPONENT_REDO, {
            execute: () => {
                this.workbenchEditorService.currentEditorGroup.componentRedo();
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.TEST_TOKENIZE, {
            execute: () => {
                const currentCodeEditor = this.workbenchEditorService.currentCodeEditor;
                if (currentCodeEditor) {
                    const selections = currentCodeEditor.getSelections();
                    if (selections && selections.length > 0 && currentCodeEditor.currentDocumentModel) {
                        const { selectionStartLineNumber, selectionStartColumn, positionLineNumber, positionColumn } = selections[0];
                        const selectionText = currentCodeEditor.currentDocumentModel.getText(new monaco.Range(selectionStartLineNumber, selectionStartColumn, positionLineNumber, positionColumn));
                        this.monacoService.testTokenize(selectionText, currentCodeEditor.currentDocumentModel.languageId);
                    }
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.SEARCH_WORKSPACE_SYMBOL, {
            execute: () => this.prefixQuickOpenService.open('#'),
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.SEARCH_WORKSPACE_SYMBOL_CLASS, {
            execute: () => this.prefixQuickOpenService.open('##'),
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.GO_TO_LINE, {
            execute: () => this.prefixQuickOpenService.open(':'),
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.TOGGLE_WORD_WRAP, {
            execute: () => {
                const wordWrap = this.preferenceService.get('editor.wordWrap');
                if (wordWrap) {
                    const values = ['off', 'on'];
                    const index = values.indexOf(wordWrap) + 1;
                    if (index > -1) {
                        this.preferenceService.set('editor.wordWrap', values[index % values.length], ide_core_common_1.PreferenceScope.User);
                    }
                }
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.FORMAT_DOCUMENT_WITH, {
            execute: async () => {
                const formatService = this.injector.get(format_service_1.DocumentFormatService);
                formatService.formatDocumentWith();
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.FORMAT_SELECTION_WITH, {
            execute: async () => {
                const formatService = this.injector.get(format_service_1.DocumentFormatService);
                formatService.formatSelectionWith();
            },
        });
    }
    registerMenus(menus) {
        menus.registerMenuItem(next_1.MenuId.EditorTitleContext, {
            command: ide_core_browser_1.EDITOR_COMMANDS.COPY_PATH.id,
            group: '10_path',
            order: 1,
        });
        menus.registerMenuItem(next_1.MenuId.EditorTitleContext, {
            command: ide_core_browser_1.EDITOR_COMMANDS.COPY_RELATIVE_PATH.id,
            group: '10_path',
            order: 2,
        });
        menus.registerMenuItem(next_1.MenuId.BreadcrumbsTitleContext, {
            command: ide_core_browser_1.EDITOR_COMMANDS.COPY_PATH.id,
            group: '0_path',
            order: 1,
        });
        menus.registerMenuItem(next_1.MenuId.BreadcrumbsTitleContext, {
            command: ide_core_browser_1.EDITOR_COMMANDS.COPY_RELATIVE_PATH.id,
            group: '0_path',
            order: 2,
        });
        menus.registerMenuItem(next_1.MenuId.BreadcrumbsTitleContext, {
            command: {
                id: ide_core_browser_1.FILE_COMMANDS.REVEAL_IN_EXPLORER.id,
                label: (0, ide_core_browser_1.localize)('file.revealInExplorer'),
            },
            group: '1_file',
            order: 3,
        });
        menus.registerMenuItem(next_1.MenuId.EditorTitleContext, {
            command: {
                id: ide_core_browser_1.FILE_COMMANDS.REVEAL_IN_EXPLORER.id,
                label: (0, ide_core_browser_1.localize)('file.revealInExplorer'),
            },
            group: '6_file',
            order: 3,
        });
        menus.registerMenuItem(next_1.MenuId.EditorTitleContext, {
            command: ide_core_browser_1.EDITOR_COMMANDS.SPLIT_TO_LEFT.id,
            group: '9_split',
        });
        menus.registerMenuItem(next_1.MenuId.EditorTitleContext, {
            command: ide_core_browser_1.EDITOR_COMMANDS.SPLIT_TO_RIGHT.id,
            group: '9_split',
        });
        menus.registerMenuItem(next_1.MenuId.EditorTitleContext, {
            command: ide_core_browser_1.EDITOR_COMMANDS.SPLIT_TO_TOP.id,
            group: '9_split',
        });
        menus.registerMenuItem(next_1.MenuId.EditorTitleContext, {
            command: ide_core_browser_1.EDITOR_COMMANDS.SPLIT_TO_BOTTOM.id,
            group: '9_split',
        });
        menus.registerMenuItem(next_1.MenuId.EditorTitleContext, {
            command: {
                id: ide_core_browser_1.EDITOR_COMMANDS.CLOSE.id,
                label: (0, ide_core_browser_1.localize)('editor.title.context.close'),
            },
            group: '0_tab',
            order: 1,
        });
        menus.registerMenuItem(next_1.MenuId.EditorTitleContext, {
            command: ide_core_browser_1.EDITOR_COMMANDS.CLOSE_ALL_IN_GROUP.id,
            group: '0_tab',
            order: 2,
        });
        menus.registerMenuItem(next_1.MenuId.EditorTitleContext, {
            command: ide_core_browser_1.EDITOR_COMMANDS.CLOSE_SAVED.id,
            group: '0_tab',
            order: 3,
        });
        menus.registerMenuItem(next_1.MenuId.EditorTitleContext, {
            command: ide_core_browser_1.EDITOR_COMMANDS.CLOSE_OTHER_IN_GROUP.id,
            group: '0_tab',
            order: 4,
        });
        menus.registerMenuItem(next_1.MenuId.EditorTitleContext, {
            command: ide_core_browser_1.EDITOR_COMMANDS.CLOSE_TO_RIGHT.id,
            group: '0_tab',
            order: 5,
        });
        menus.registerMenuItem(next_1.MenuId.EditorTitle, {
            command: ide_core_browser_1.EDITOR_COMMANDS.CLOSE_ALL_IN_GROUP.id,
            group: '0_internal',
        });
        menus.registerMenuItem(next_1.MenuId.EditorTitle, {
            command: ide_core_browser_1.EDITOR_COMMANDS.SPLIT_TO_RIGHT.id,
            group: 'navigation',
            when: 'resource',
            order: 5,
        });
        menus.registerMenuItem(next_1.MenuId.EditorContext, {
            command: ide_core_browser_1.EDITOR_COMMANDS.FORMAT_DOCUMENT_WITH.id,
            group: '1_modification',
            order: 1.3,
            when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasMultipleDocumentFormattingProvider),
        });
        menus.registerMenuItem(next_1.MenuId.EditorContext, {
            command: ide_core_browser_1.EDITOR_COMMANDS.FORMAT_SELECTION_WITH.id,
            when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasMultipleDocumentSelectionFormattingProvider, editorContextKeys_1.EditorContextKeys.hasNonEmptySelection),
            group: '1_modification',
            order: 1.31,
        });
    }
    registerOpener(regisry) {
        regisry.registerOpener(this.editorOpener);
    }
    registerQuickOpenHandlers(handlers) {
        handlers.registerHandler(this.workspaceSymbolQuickOpenHandler, {
            title: (0, ide_core_browser_1.localize)('quickopen.tab.symbol'),
            order: 3,
            commandId: ide_core_browser_1.EDITOR_COMMANDS.SEARCH_WORKSPACE_SYMBOL.id,
            sub: {
                // 将类单独作为一个 tab，Java 场景比较常见，其它技术栈可能不一定
                '#': {
                    title: (0, ide_core_browser_1.localize)('quickopen.tab.class'),
                    order: 2,
                    commandId: ide_core_browser_1.EDITOR_COMMANDS.SEARCH_WORKSPACE_SYMBOL_CLASS.id,
                },
            },
        });
        handlers.registerHandler(this.goToLineQuickOpenHandler, {
            title: (0, ide_core_browser_1.localize)('quickopen.tab.goToLine'),
            commandId: ide_core_browser_1.EDITOR_COMMANDS.GO_TO_LINE.id,
            order: 5,
        });
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(di_1.INJECTOR_TOKEN),
    tslib_1.__metadata("design:type", di_1.Injector)
], EditorContribution.prototype, "injector", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.AppConfig),
    tslib_1.__metadata("design:type", Object)
], EditorContribution.prototype, "appConfig", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(common_1.WorkbenchEditorService),
    tslib_1.__metadata("design:type", workbench_editor_service_1.WorkbenchEditorServiceImpl)
], EditorContribution.prototype, "workbenchEditorService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(),
    tslib_1.__metadata("design:type", editor_status_bar_service_1.EditorStatusBarService)
], EditorContribution.prototype, "editorStatusBarService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.QuickPickService),
    tslib_1.__metadata("design:type", Object)
], EditorContribution.prototype, "quickPickService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(common_1.ILanguageService),
    tslib_1.__metadata("design:type", Object)
], EditorContribution.prototype, "languagesService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(types_1.IEditorDocumentModelService),
    tslib_1.__metadata("design:type", Object)
], EditorContribution.prototype, "editorDocumentModelService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(common_1.IDocPersistentCacheProvider),
    tslib_1.__metadata("design:type", Object)
], EditorContribution.prototype, "cacheProvider", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(),
    tslib_1.__metadata("design:type", history_1.EditorHistoryService)
], EditorContribution.prototype, "historyService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(),
    tslib_1.__metadata("design:type", ide_core_browser_1.MonacoService)
], EditorContribution.prototype, "monacoService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.IOpenerService),
    tslib_1.__metadata("design:type", Object)
], EditorContribution.prototype, "openerService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_common_1.ILogger),
    tslib_1.__metadata("design:type", Object)
], EditorContribution.prototype, "logger", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(),
    tslib_1.__metadata("design:type", editor_opener_1.EditorOpener)
], EditorContribution.prototype, "editorOpener", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.IClipboardService),
    tslib_1.__metadata("design:type", Object)
], EditorContribution.prototype, "clipboardService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(),
    tslib_1.__metadata("design:type", workspace_symbol_quickopen_1.WorkspaceSymbolQuickOpenHandler)
], EditorContribution.prototype, "workspaceSymbolQuickOpenHandler", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.PrefixQuickOpenService),
    tslib_1.__metadata("design:type", Object)
], EditorContribution.prototype, "prefixQuickOpenService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(),
    tslib_1.__metadata("design:type", go_to_line_1.GoToLineQuickOpenHandler)
], EditorContribution.prototype, "goToLineQuickOpenHandler", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.PreferenceService),
    tslib_1.__metadata("design:type", Object)
], EditorContribution.prototype, "preferenceService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(tokenizer_1.ITextmateTokenizer),
    tslib_1.__metadata("design:type", Object)
], EditorContribution.prototype, "textmateService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.CorePreferences),
    tslib_1.__metadata("design:type", Object)
], EditorContribution.prototype, "corePreferences", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(merge_editor_service_1.MergeEditorService),
    tslib_1.__metadata("design:type", merge_editor_service_1.MergeEditorService)
], EditorContribution.prototype, "mergeEditorService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(types_2.IEditorDocumentModelContentRegistry),
    tslib_1.__metadata("design:type", Object)
], EditorContribution.prototype, "contentRegistry", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(menu_interface_1.AbstractContextMenuService),
    tslib_1.__metadata("design:type", menu_interface_1.AbstractContextMenuService)
], EditorContribution.prototype, "contextMenuService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.IContextKeyService),
    tslib_1.__metadata("design:type", Object)
], EditorContribution.prototype, "globalContextKeyService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(base_1.ICtxMenuRenderer),
    tslib_1.__metadata("design:type", base_1.ICtxMenuRenderer)
], EditorContribution.prototype, "contextMenuRenderer", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(electron_1.IElectronMainUIService),
    tslib_1.__metadata("design:type", Object)
], EditorContribution.prototype, "electronMainUIService", void 0);
EditorContribution = tslib_1.__decorate([
    (0, ide_core_browser_1.Domain)(ide_core_browser_1.CommandContribution, ide_core_browser_1.ClientAppContribution, ide_core_browser_1.KeybindingContribution, ide_core_browser_1.MonacoContribution, layout_1.ComponentContribution, next_1.MenuContribution, ide_core_browser_1.OpenerContribution, ide_core_browser_1.QuickOpenContribution)
], EditorContribution);
exports.EditorContribution = EditorContribution;
let EditorAutoSaveEditorContribution = class EditorAutoSaveEditorContribution {
    registerEditorFeature(registry) {
        registry.registerEditorFeatureContribution({
            contribute: (editor) => {
                const disposable = new ide_core_browser_1.Disposable();
                disposable.addDispose(editor.monacoEditor.onDidBlurEditorWidget(() => {
                    if (this.preferenceService.get('editor.autoSave') === editor_1.AUTO_SAVE_MODE.EDITOR_FOCUS_CHANGE) {
                        if (editor.currentDocumentModel &&
                            !editor.currentDocumentModel.closeAutoSave &&
                            editor.currentDocumentModel.dirty &&
                            editor.currentDocumentModel.savable) {
                            editor.currentDocumentModel.save(undefined, common_1.SaveReason.FocusOut);
                        }
                    }
                }));
                disposable.addDispose(editor.monacoEditor.onDidChangeModel((e) => {
                    if (this.preferenceService.get('editor.autoSave') === editor_1.AUTO_SAVE_MODE.EDITOR_FOCUS_CHANGE) {
                        if (e.oldModelUrl) {
                            const oldUri = new ide_core_browser_1.URI(e.oldModelUrl.toString());
                            const docRef = this.editorDocumentService.getModelReference(oldUri, 'editor-focus-autosave');
                            if (docRef && !docRef.instance.closeAutoSave && docRef.instance.dirty && docRef.instance.savable) {
                                docRef.instance.save(undefined, common_1.SaveReason.FocusOut);
                            }
                            docRef === null || docRef === void 0 ? void 0 : docRef.dispose();
                        }
                    }
                }));
                return disposable;
            },
        });
        window.addEventListener('blur', () => {
            if (this.preferenceService.get('editor.autoSave') === editor_1.AUTO_SAVE_MODE.WINDOWS_LOST_FOCUS) {
                this.commandService.executeCommand(ide_core_browser_1.EDITOR_COMMANDS.SAVE_ALL.id, common_1.SaveReason.FocusOut);
            }
        });
        this.preferenceSettings.setEnumLabels('editor.autoSave', {
            [editor_1.AUTO_SAVE_MODE.OFF]: (0, ide_core_browser_1.localize)('editor.autoSave.enum.off'),
            [editor_1.AUTO_SAVE_MODE.AFTER_DELAY]: (0, ide_core_browser_1.localize)('editor.autoSave.enum.afterDelay'),
            [editor_1.AUTO_SAVE_MODE.EDITOR_FOCUS_CHANGE]: (0, ide_core_browser_1.localize)('editor.autoSave.enum.editorFocusChange'),
            [editor_1.AUTO_SAVE_MODE.WINDOWS_LOST_FOCUS]: (0, ide_core_browser_1.localize)('editor.autoSave.enum.windowLostFocus'),
        });
        registry.registerEditorFeatureContribution(new topPadding_1.EditorTopPaddingContribution());
        registry.registerEditorFeatureContribution(this.injector.get(suggest_widget_1.EditorSuggestWidgetContribution));
        this.registerAutoSaveConfigurationChange();
    }
    registerAutoSaveConfigurationChange() {
        this.preferenceService.onSpecificPreferenceChange('editor.autoSave', (change) => {
            const mode = change.newValue;
            if (mode !== editor_1.AUTO_SAVE_MODE.OFF) {
                // 只有两种原因：丢失焦点和延迟保存，非此即彼
                let reason = common_1.SaveReason.FocusOut;
                if (mode === editor_1.AUTO_SAVE_MODE.AFTER_DELAY) {
                    reason = common_1.SaveReason.AfterDelay;
                }
                // 只保存被该设置影响的文档
                // 比如在当前工作区写代码，然后打开了一个 ~/.xxx 文件
                // 然后用户修改了设置，这里就只保存当前工作区的文件。
                for (const group of this.workbenchEditorService.editorGroups) {
                    for (const resource of group.resources) {
                        if (change.affects(resource === null || resource === void 0 ? void 0 : resource.uri.toString())) {
                            group.saveResource(resource, reason);
                        }
                    }
                }
            }
        });
    }
    registerCommands(commands) {
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.AUTO_SAVE, {
            execute: () => {
                const autoSavePreferenceField = 'editor.autoSave';
                const value = this.preferenceSettings.getPreference(autoSavePreferenceField, ide_core_common_1.PreferenceScope.User).value ||
                    editor_1.AUTO_SAVE_MODE.OFF;
                const nextValue = [
                    editor_1.AUTO_SAVE_MODE.AFTER_DELAY,
                    editor_1.AUTO_SAVE_MODE.EDITOR_FOCUS_CHANGE,
                    editor_1.AUTO_SAVE_MODE.WINDOWS_LOST_FOCUS,
                ].includes(value)
                    ? editor_1.AUTO_SAVE_MODE.OFF
                    : editor_1.AUTO_SAVE_MODE.AFTER_DELAY;
                return this.preferenceSettings.setPreference(autoSavePreferenceField, nextValue, ide_core_common_1.PreferenceScope.User);
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.COPY_PATH, {
            execute: (resource) => {
                if (!resource) {
                    return;
                }
                this.commandService.executeCommand(ide_core_browser_1.FILE_COMMANDS.COPY_PATH.id, resource.uri);
            },
        });
        commands.registerCommand(ide_core_browser_1.EDITOR_COMMANDS.COPY_RELATIVE_PATH, {
            execute: (resource) => {
                if (!resource) {
                    return;
                }
                this.commandService.executeCommand(ide_core_browser_1.FILE_COMMANDS.COPY_RELATIVE_PATH.id, resource.uri);
            },
        });
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(di_1.INJECTOR_TOKEN),
    tslib_1.__metadata("design:type", di_1.Injector)
], EditorAutoSaveEditorContribution.prototype, "injector", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.PreferenceService),
    tslib_1.__metadata("design:type", Object)
], EditorAutoSaveEditorContribution.prototype, "preferenceService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(common_1.WorkbenchEditorService),
    tslib_1.__metadata("design:type", workbench_editor_service_1.WorkbenchEditorServiceImpl)
], EditorAutoSaveEditorContribution.prototype, "workbenchEditorService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.CommandService),
    tslib_1.__metadata("design:type", Object)
], EditorAutoSaveEditorContribution.prototype, "commandService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(types_1.IEditorDocumentModelService),
    tslib_1.__metadata("design:type", Object)
], EditorAutoSaveEditorContribution.prototype, "editorDocumentService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.IPreferenceSettingsService),
    tslib_1.__metadata("design:type", Object)
], EditorAutoSaveEditorContribution.prototype, "preferenceSettings", void 0);
EditorAutoSaveEditorContribution = tslib_1.__decorate([
    (0, ide_core_browser_1.Domain)(types_3.BrowserEditorContribution, ide_core_browser_1.CommandContribution)
], EditorAutoSaveEditorContribution);
exports.EditorAutoSaveEditorContribution = EditorAutoSaveEditorContribution;
//# sourceMappingURL=editor.contribution.js.map