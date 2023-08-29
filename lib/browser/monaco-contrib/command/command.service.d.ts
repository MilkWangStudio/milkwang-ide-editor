import { Command, Emitter, CommandRegistry, CommandHandler, CommandService, IReporterService } from '@opensumi/ide-core-browser';
import { EditorExtensionsRegistry, ICommandEvent, ICommandService, IMonacoActionRegistry, IMonacoCommandService, IMonacoCommandsRegistry, MonacoEditorCommandHandler } from '@opensumi/ide-monaco/lib/browser/contrib/command';
import { Event, ICodeEditor, IEvent } from '@opensumi/ide-monaco/lib/browser/monaco-api/types';
import { MonacoCodeService } from '../../editor.override';
/**
 * monaco 命令分两种
 *  一种命令不需要带参数，是封装过的命令，即为 action
 * 一种是正常命令，执行可以带参数
 */
export declare enum MonacoCommandType {
    ACTION = 0,
    COMMAND = 1
}
export type MonacoCommand = Command & {
    type: MonacoCommandType;
};
export declare class MonacoCommandService implements IMonacoCommandService {
    _serviceBrand: undefined;
    private _onDidExecuteCommand;
    onDidExecuteCommand: Event<ICommandEvent>;
    private delegate;
    /**
     * 事件触发器，在执行命令的时候会触发
     * @type {Emitter<ICommandEvent>}
     * @memberof MonacoCommandService
     */
    _onWillExecuteCommand: Emitter<ICommandEvent>;
    private logger;
    commandRegistry: CommandRegistry;
    commandService: CommandService;
    reporterService: IReporterService;
    /**
     * 设置委托对象
     * @param delegate 真正要执行 monaco 内部 command 的 commandSerice
     */
    setDelegate(delegate: ICommandService): void;
    get onWillExecuteCommand(): IEvent<ICommandEvent>;
    /**
     * 执行命令
     * 先去全局 commands 里找，若没有尝试执行 delegate 的 command
     * @param commandId
     * @param args
     */
    executeCommand<T>(commandId: string, ...args: any[]): Promise<T | undefined>;
}
export declare class MonacoCommandRegistry implements IMonacoCommandsRegistry {
    private commands;
    private workbenchEditorService;
    private editorCollectionService;
    private readonly overrideServiceRegistry;
    /**
     * 校验 command id 是否是 monaco id
     * @param command 要校验的 id
     * @returns 若找到则为转换过 monaco id，否则为 undefined
     */
    validate(command: string): string | undefined;
    /**
     * 注册 monaco 命令
     * 命令 id 会统一加入 monaco 前缀
     * monaco handler 会注入当前 editor 参数
     * @param command 注册的命令
     * @param handler 命令处理函数
     */
    registerCommand(command: Command, handler: MonacoEditorCommandHandler): void;
    /**
     * 注册处理函数函数
     * monaco handler 会注入当前 editor 参数
     * @param command 命令 id
     * @param handler 命令处理函数
     */
    registerHandler(commandID: string, handler: MonacoEditorCommandHandler): void;
    /**
     * 包装 monaco 命令处理函数为内部处理函数
     * @param monacoHandler 要处理的 monaco 命令处理函数
     */
    protected newHandler(monacoHandler: MonacoEditorCommandHandler): CommandHandler;
    /**
     * 给 monacoHandler 传递 editor 参数
     * @param monacoHandler 要处理的 monaco 命令函数
     * @param args 要透传的参数
     */
    protected execute(monacoHandler: MonacoEditorCommandHandler, ...args: any[]): any;
    get codeEditorService(): MonacoCodeService | undefined;
    /**
     * 获取当前活动的编辑器
     * 此处的活动编辑器和 workbenchEditorService.currentEditor 的概念不同，对于diffEditor，需要获取确实的那个editor而不是modifiedEditor
     */
    protected getActiveCodeEditor(): ICodeEditor | undefined;
}
export declare class MonacoActionRegistry implements IMonacoActionRegistry {
    private static COMMON_ACTIONS;
    private static CONVERT_MONACO_COMMAND_ARGS;
    private static CONVERT_MONACO_ACTIONS_TO_CONTRIBUTION_ID;
    /**
     * 要排除注册的 Action
     *
     * @protected
     * @memberof MonacoActionModule
     */
    protected static readonly EXCLUDE_ACTIONS: string[];
    monacoCommandRegistry: MonacoCommandRegistry;
    private readonly overrideServiceRegistry;
    get globalInstantiationService(): import("@opensumi/monaco-editor-core/esm/vs/platform/instantiation/common/instantiation").IInstantiationService;
    get monacoEditorRegistry(): typeof EditorExtensionsRegistry;
    get monacoCommands(): import("@opensumi/monaco-editor-core/esm/vs/platform/commands/common/commands").ICommandsMap;
    registerMonacoActions(): void;
    /**
     * monaco 内部有些 contribution 既注册了 actions 又注册了 commands，在这里优先调取 commands
     */
    private actAndComHandler;
    /**
     * 是否是 _execute 开头的 monaco 命令
     */
    private isInternalExecuteCommand;
    /**
     * monaco 内部会判断 uri 执行是否是 Uri 实例，执行改类命令统一转换一下
     * @param args
     */
    private processInternalCommandArgument;
    /**
     * 调用 monaco 内部 _commandService 执行命令
     * 实际执行的就是 MonacoCommandService
     * @param commandId 命令名称
     */
    protected newCommandHandler(commandId: string): MonacoEditorCommandHandler;
    /**
     * 包装 action 为命令处理函数
     * 调用 getAction 执行 run 命令
     * @param id action id
     */
    protected newActionHandler(id: string): MonacoEditorCommandHandler;
    /**
     * 执行 action
     * @param id 要执行的 action
     * @param editor 执行 action 的 editor，默认为当前 editor
     */
    protected runAction(id: string, editor: ICodeEditor): Promise<void>;
    /**
     * 生成键盘处理函数
     * @param action 对应 action
     */
    protected newKeyboardHandler(action: string): MonacoEditorCommandHandler;
}
//# sourceMappingURL=command.service.d.ts.map