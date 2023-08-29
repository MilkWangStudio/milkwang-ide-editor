"use strict";
var MonacoActionRegistry_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonacoActionRegistry = exports.MonacoCommandRegistry = exports.MonacoCommandService = exports.MonacoCommandType = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const ide_monaco_1 = require("@opensumi/ide-monaco");
const command_1 = require("@opensumi/ide-monaco/lib/browser/contrib/command");
const monaco_api_1 = require("@opensumi/ide-monaco/lib/browser/monaco-api");
const services_1 = require("@opensumi/ide-monaco/lib/browser/monaco-api/services");
const types_1 = require("../../types");
/**
 * vscode 会有一些别名 command，如果直接执行这些别名 command 会报错，做一个转换
 */
const MonacoCommandAlias = {
    'editor.action.smartSelect.grow': 'editor.action.smartSelect.expand',
    cursorWordPartStartLeft: 'cursorWordPartLeft',
    cursorWordPartStartLeftSelect: 'cursorWordPartLeftSelect',
    'editor.action.previewDeclaration': 'editor.action.peekDefinition',
    'editor.action.openDeclarationToTheSide': 'editor.action.revealDefinitionAside',
    'editor.action.goToDeclaration': 'editor.action.revealDefinition',
};
/**
 * monaco 命令分两种
 *  一种命令不需要带参数，是封装过的命令，即为 action
 * 一种是正常命令，执行可以带参数
 */
var MonacoCommandType;
(function (MonacoCommandType) {
    MonacoCommandType[MonacoCommandType["ACTION"] = 0] = "ACTION";
    MonacoCommandType[MonacoCommandType["COMMAND"] = 1] = "COMMAND";
})(MonacoCommandType = exports.MonacoCommandType || (exports.MonacoCommandType = {}));
let MonacoCommandService = class MonacoCommandService {
    constructor() {
        this._onDidExecuteCommand = new ide_core_browser_1.Emitter();
        this.onDidExecuteCommand = this._onDidExecuteCommand.event;
        /**
         * 事件触发器，在执行命令的时候会触发
         * @type {Emitter<ICommandEvent>}
         * @memberof MonacoCommandService
         */
        this._onWillExecuteCommand = new ide_core_browser_1.Emitter();
    }
    /**
     * 设置委托对象
     * @param delegate 真正要执行 monaco 内部 command 的 commandSerice
     */
    setDelegate(delegate) {
        this.delegate = delegate;
    }
    get onWillExecuteCommand() {
        return this._onWillExecuteCommand.event;
    }
    /**
     * 执行命令
     * 先去全局 commands 里找，若没有尝试执行 delegate 的 command
     * @param commandId
     * @param args
     */
    async executeCommand(commandId, ...args) {
        this.logger.debug('command: ' + commandId);
        this._onWillExecuteCommand.fire({ commandId, args });
        try {
            const res = await this.commandService.executeCommand(commandId, ...args);
            this._onDidExecuteCommand.fire({ commandId, args });
            return res;
        }
        catch (err) {
            // 如果不是当前命令的 handler 未找到直接抛错，否则执行 delegate 逻辑
            if ((err === null || err === void 0 ? void 0 : err.name) !== `${ide_core_browser_1.HANDLER_NOT_FOUND}:${commandId}`) {
                throw err;
            }
        }
        if (this.delegate) {
            const res = this.delegate.executeCommand(MonacoCommandAlias[commandId] ? MonacoCommandAlias[commandId] : commandId, ...args);
            this._onDidExecuteCommand.fire({ commandId, args });
            return res;
        }
        this.reporterService.point(ide_core_browser_1.REPORT_NAME.NOT_FOUND_COMMAND, commandId);
        return Promise.reject(new Error(`command '${commandId}' not found`));
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.ILogger),
    tslib_1.__metadata("design:type", Object)
], MonacoCommandService.prototype, "logger", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.CommandRegistry),
    tslib_1.__metadata("design:type", Object)
], MonacoCommandService.prototype, "commandRegistry", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.CommandService),
    tslib_1.__metadata("design:type", Object)
], MonacoCommandService.prototype, "commandService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.IReporterService),
    tslib_1.__metadata("design:type", Object)
], MonacoCommandService.prototype, "reporterService", void 0);
MonacoCommandService = tslib_1.__decorate([
    (0, di_1.Injectable)()
], MonacoCommandService);
exports.MonacoCommandService = MonacoCommandService;
let MonacoCommandRegistry = class MonacoCommandRegistry {
    /**
     * 校验 command id 是否是 monaco id
     * @param command 要校验的 id
     * @returns 若找到则为转换过 monaco id，否则为 undefined
     */
    validate(command) {
        var _a;
        return (_a = this.commands.getRawCommand(command)) === null || _a === void 0 ? void 0 : _a.id;
    }
    /**
     * 注册 monaco 命令
     * 命令 id 会统一加入 monaco 前缀
     * monaco handler 会注入当前 editor 参数
     * @param command 注册的命令
     * @param handler 命令处理函数
     */
    registerCommand(command, handler) {
        this.commands.registerCommand(command, this.newHandler(handler));
    }
    /**
     * 注册处理函数函数
     * monaco handler 会注入当前 editor 参数
     * @param command 命令 id
     * @param handler 命令处理函数
     */
    registerHandler(commandID, handler) {
        this.commands.registerHandler(commandID, this.newHandler(handler));
    }
    /**
     * 包装 monaco 命令处理函数为内部处理函数
     * @param monacoHandler 要处理的 monaco 命令处理函数
     */
    newHandler(monacoHandler) {
        return {
            execute: (...args) => this.execute(monacoHandler, ...args),
        };
    }
    /**
     * 给 monacoHandler 传递 editor 参数
     * @param monacoHandler 要处理的 monaco 命令函数
     * @param args 要透传的参数
     */
    execute(monacoHandler, ...args) {
        const editor = this.getActiveCodeEditor();
        if (editor) {
            // editor.focus();
            return Promise.resolve(monacoHandler.execute(editor, ...args));
        }
        return Promise.resolve();
    }
    get codeEditorService() {
        return this.overrideServiceRegistry.getRegisteredService(ide_core_browser_1.ServiceNames.CODE_EDITOR_SERVICE);
    }
    /**
     * 获取当前活动的编辑器
     * 此处的活动编辑器和 workbenchEditorService.currentEditor 的概念不同，对于diffEditor，需要获取确实的那个editor而不是modifiedEditor
     */
    getActiveCodeEditor() {
        var _a;
        // 先从 monaco 内部获取到当前 focus 的 editor
        const editor = (_a = this.codeEditorService) === null || _a === void 0 ? void 0 : _a.getFocusedCodeEditor();
        if (editor) {
            return editor;
        }
        // 如果获取不到再从 editor-collection 的焦点追踪，contextMenu追踪中取
        if (this.editorCollectionService.currentEditor) {
            return this.editorCollectionService.currentEditor.monacoEditor;
        }
        // 使用当前 editorGroup.editor 兜底
        const editorGroup = this.workbenchEditorService.currentEditorGroup;
        if (editorGroup) {
            const editor = editorGroup.currentOrPreviousFocusedEditor || editorGroup.currentEditor;
            if (editor) {
                return editor.monacoEditor;
            }
        }
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.CommandRegistry),
    tslib_1.__metadata("design:type", Object)
], MonacoCommandRegistry.prototype, "commands", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(types_1.WorkbenchEditorService),
    tslib_1.__metadata("design:type", types_1.WorkbenchEditorService)
], MonacoCommandRegistry.prototype, "workbenchEditorService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(types_1.EditorCollectionService),
    tslib_1.__metadata("design:type", types_1.EditorCollectionService)
], MonacoCommandRegistry.prototype, "editorCollectionService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.MonacoOverrideServiceRegistry),
    tslib_1.__metadata("design:type", ide_core_browser_1.MonacoOverrideServiceRegistry)
], MonacoCommandRegistry.prototype, "overrideServiceRegistry", void 0);
MonacoCommandRegistry = tslib_1.__decorate([
    (0, di_1.Injectable)()
], MonacoCommandRegistry);
exports.MonacoCommandRegistry = MonacoCommandRegistry;
let MonacoActionRegistry = MonacoActionRegistry_1 = class MonacoActionRegistry {
    get globalInstantiationService() {
        const codeEditorService = this.overrideServiceRegistry.getRegisteredService(ide_core_browser_1.ServiceNames.CODE_EDITOR_SERVICE);
        const textModelService = this.overrideServiceRegistry.getRegisteredService(ide_core_browser_1.ServiceNames.TEXT_MODEL_SERVICE);
        const contextKeyService = this.overrideServiceRegistry.getRegisteredService(ide_core_browser_1.ServiceNames.CONTEXT_KEY_SERVICE);
        const globalInstantiationService = services_1.StandaloneServices.initialize({
            codeEditorService,
            textModelService,
            contextKeyService,
        });
        return globalInstantiationService;
    }
    get monacoEditorRegistry() {
        return command_1.EditorExtensionsRegistry;
    }
    get monacoCommands() {
        return command_1.CommandsRegistry.getCommands();
    }
    registerMonacoActions() {
        var _a;
        const editorActions = new Map(this.monacoEditorRegistry.getEditorActions().map(({ id, label, alias }) => [
            id,
            {
                label,
                alias,
            },
        ]));
        for (const id of this.monacoCommands.keys()) {
            if (MonacoActionRegistry_1.EXCLUDE_ACTIONS.includes(id)) {
                continue;
            }
            const data = (_a = editorActions.get(id)) !== null && _a !== void 0 ? _a : {};
            const handler = this.actAndComHandler(editorActions, id);
            this.monacoCommandRegistry.registerCommand({
                id,
                label: data.label,
                labelLocalized: data.label && data.alias
                    ? {
                        alias: data.alias,
                        localized: data.label,
                        raw: data.label,
                    }
                    : undefined,
            }, handler);
            // 将 monaco 命令处理函数代理到有 label 的新的命令上
            const command = MonacoActionRegistry_1.COMMON_ACTIONS.get(id);
            if (command) {
                this.monacoCommandRegistry.registerHandler(command, handler);
            }
        }
    }
    /**
     * monaco 内部有些 contribution 既注册了 actions 又注册了 commands，在这里优先调取 commands
     */
    actAndComHandler(actions, id) {
        if (MonacoActionRegistry_1.CONVERT_MONACO_ACTIONS_TO_CONTRIBUTION_ID.has(id)) {
            const toConver = MonacoActionRegistry_1.CONVERT_MONACO_ACTIONS_TO_CONTRIBUTION_ID.get(id);
            if (this.monacoEditorRegistry.getSomeEditorContributions([toConver]).length > 0) {
                return this.newCommandHandler(id);
            }
        }
        return actions.has(id) ? this.newActionHandler(id) : this.newCommandHandler(id);
    }
    /**
     * 是否是 _execute 开头的 monaco 命令
     */
    isInternalExecuteCommand(commandId) {
        return commandId.startsWith('_execute');
    }
    /**
     * monaco 内部会判断 uri 执行是否是 Uri 实例，执行改类命令统一转换一下
     * @param args
     */
    processInternalCommandArgument(commandId, args = []) {
        if (this.isInternalExecuteCommand(commandId)) {
            return args.map((arg) => (arg instanceof ide_core_browser_1.Uri ? monaco_api_1.URI.revive(arg) : arg));
        }
        else if (MonacoActionRegistry_1.CONVERT_MONACO_COMMAND_ARGS.has(commandId)) {
            return MonacoActionRegistry_1.CONVERT_MONACO_COMMAND_ARGS.get(commandId)(...args);
        }
        return args;
    }
    /**
     * 调用 monaco 内部 _commandService 执行命令
     * 实际执行的就是 MonacoCommandService
     * @param commandId 命令名称
     */
    newCommandHandler(commandId) {
        return {
            execute: (editor, ...args) => {
                var _a;
                if (!editor) {
                    return;
                }
                const editorCommand = !!this.monacoEditorRegistry.getEditorCommand(commandId) ||
                    !(this.isInternalExecuteCommand(commandId) ||
                        commandId === 'setContext' ||
                        MonacoActionRegistry_1.COMMON_ACTIONS.has(commandId));
                const instantiationService = editorCommand
                    ? editor && editor['_instantiationService']
                    : this.globalInstantiationService;
                if (!instantiationService) {
                    return;
                }
                const commandArgs = this.processInternalCommandArgument(commandId, args);
                return instantiationService.invokeFunction((_a = this.monacoCommands.get(commandId)) === null || _a === void 0 ? void 0 : _a.handler, ...commandArgs);
            },
        };
    }
    /**
     * 包装 action 为命令处理函数
     * 调用 getAction 执行 run 命令
     * @param id action id
     */
    newActionHandler(id) {
        return {
            execute: (editor) => {
                const action = editor.getAction(id);
                if (action && action.isSupported()) {
                    return this.runAction(id, editor);
                }
            },
        };
    }
    /**
     * 执行 action
     * @param id 要执行的 action
     * @param editor 执行 action 的 editor，默认为当前 editor
     */
    runAction(id, editor) {
        if (editor) {
            const action = editor.getAction(id);
            if (action) {
                return action.run();
            }
        }
        return Promise.resolve();
    }
    /**
     * 生成键盘处理函数
     * @param action 对应 action
     */
    newKeyboardHandler(action) {
        return {
            execute: (editor, ...args) => editor.trigger('keyboard', action, args),
        };
    }
};
MonacoActionRegistry.COMMON_ACTIONS = new Map([
    [ide_monaco_1.DELEGATE_COMMANDS.UNDO, ide_core_browser_1.EDITOR_COMMANDS.UNDO.id],
    [ide_monaco_1.DELEGATE_COMMANDS.REDO, ide_core_browser_1.EDITOR_COMMANDS.REDO.id],
    [ide_monaco_1.DELEGATE_COMMANDS.SELECT_ALL, ide_core_browser_1.EDITOR_COMMANDS.SELECT_ALL.id],
]);
MonacoActionRegistry.CONVERT_MONACO_COMMAND_ARGS = new Map([
    ['editor.action.showReferences', (uri, ...args) => [monaco_api_1.URI.parse(uri), ...args]],
    ['editor.action.goToLocations', (uri, ...args) => [monaco_api_1.URI.parse(uri), ...args]],
]);
MonacoActionRegistry.CONVERT_MONACO_ACTIONS_TO_CONTRIBUTION_ID = new Map([
    ['editor.action.rename', 'editor.contrib.renameController'],
]);
/**
 * 要排除注册的 Action
 *
 * @protected
 * @memberof MonacoActionModule
 */
MonacoActionRegistry.EXCLUDE_ACTIONS = [
    'setContext',
    'editor.action.quickCommand',
    'editor.action.quickOutline',
    'editor.action.toggleHighContrast',
    'editor.action.gotoLine',
];
tslib_1.__decorate([
    (0, di_1.Autowired)(),
    tslib_1.__metadata("design:type", MonacoCommandRegistry)
], MonacoActionRegistry.prototype, "monacoCommandRegistry", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.MonacoOverrideServiceRegistry),
    tslib_1.__metadata("design:type", ide_core_browser_1.MonacoOverrideServiceRegistry)
], MonacoActionRegistry.prototype, "overrideServiceRegistry", void 0);
tslib_1.__decorate([
    ide_core_browser_1.memoize,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], MonacoActionRegistry.prototype, "globalInstantiationService", null);
tslib_1.__decorate([
    ide_core_browser_1.memoize,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], MonacoActionRegistry.prototype, "monacoEditorRegistry", null);
tslib_1.__decorate([
    ide_core_browser_1.memoize,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], MonacoActionRegistry.prototype, "monacoCommands", null);
MonacoActionRegistry = MonacoActionRegistry_1 = tslib_1.__decorate([
    (0, di_1.Injectable)()
], MonacoActionRegistry);
exports.MonacoActionRegistry = MonacoActionRegistry;
//# sourceMappingURL=command.service.js.map