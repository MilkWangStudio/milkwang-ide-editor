"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextmateService = exports.getLegalThemeName = exports.getEncodedLanguageId = void 0;
const tslib_1 = require("tslib");
const vscode_oniguruma_1 = require("vscode-oniguruma");
const vscode_textmate_1 = require("vscode-textmate");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const ide_core_common_1 = require("@opensumi/ide-core-common");
const common_1 = require("@opensumi/ide-file-service/lib/common");
const monaco_api_1 = require("@opensumi/ide-monaco/lib/browser/monaco-api");
const common_2 = require("@opensumi/ide-monaco/lib/common");
const event_1 = require("@opensumi/ide-theme/lib/common/event");
const arrays_1 = require("@opensumi/ide-utils/lib/arrays");
const language_1 = require("@opensumi/monaco-editor-core/esm/vs/editor/common/languages/language");
const standaloneServices_1 = require("@opensumi/monaco-editor-core/esm/vs/editor/standalone/browser/standaloneServices");
const types_1 = require("../../doc-model/types");
const textmate_registry_1 = require("./textmate-registry");
const textmate_tokenizer_1 = require("./textmate-tokenizer");
let wasmLoaded = false;
function getEncodedLanguageId(languageId) {
    return monaco_api_1.monaco.languages.getEncodedLanguageId(languageId);
}
exports.getEncodedLanguageId = getEncodedLanguageId;
function getLegalThemeName(name) {
    return name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}
exports.getLegalThemeName = getLegalThemeName;
class OnigasmLib {
    createOnigScanner(source) {
        return new vscode_oniguruma_1.OnigScanner(source);
    }
    createOnigString(source) {
        return new vscode_oniguruma_1.OnigString(source);
    }
}
function isStringArr(something) {
    if (!Array.isArray(something)) {
        return false;
    }
    for (let i = 0, len = something.length; i < len; i++) {
        if (typeof something[i] !== 'string') {
            return false;
        }
    }
    return true;
}
function isCharacterPair(something) {
    return isStringArr(something) && something.length === 2;
}
let TextmateService = class TextmateService extends ide_core_browser_1.WithEventBus {
    constructor() {
        super(...arguments);
        this.registeredGrammarDisposableCollection = new Map();
        this.injections = new Map();
        this.activatedLanguage = new Set();
        this.languageConfigLocation = new Map();
        this.languageConfiguration = new Map();
        this.initialized = false;
        this.dynamicLanguages = [];
    }
    /**
     * start contribution 做初始化
     */
    init() {
        this.initGrammarRegistry();
        this.listenThemeChange();
        this.listenPreferenceChange();
    }
    // themeName要求：/^[a-z0-9\-]+$/ 来源vscode源码
    listenThemeChange() {
        this.eventBus.on(event_1.ThemeChangedEvent, (e) => {
            const themeData = e.payload.theme.themeData;
            if (themeData !== this.editorTheme) {
                this.editorTheme = themeData;
                this.setTheme(themeData);
            }
        });
    }
    async registerLanguage(language, extPath) {
        return this.registerLanguages([language], extPath);
    }
    reviveLanguageConfiguration(id, configuration) {
        return {
            wordPattern: this.createRegex(configuration.wordPattern),
            autoClosingPairs: this.extractValidAutoClosingPairs(id, configuration),
            brackets: this.extractValidBrackets(id, configuration),
            comments: this.extractValidCommentRule(id, configuration),
            folding: this.convertFolding(configuration.folding),
            surroundingPairs: this.extractValidSurroundingPairs(id, configuration),
            indentationRules: this.convertIndentationRules(configuration.indentationRules),
            autoCloseBefore: configuration.autoCloseBefore,
            colorizedBracketPairs: this.extractValidColorizedBracketPairs(id, configuration),
            onEnterRules: this.extractValidOnEnterRules(id, configuration),
        };
    }
    get monacoLanguageService() {
        return standaloneServices_1.StandaloneServices.get(language_1.ILanguageService);
    }
    isEmbeddedLanguageOnly(language) {
        return (!language.filenames &&
            !language.extensions &&
            !language.filenamePatterns &&
            !language.firstLine &&
            !language.mimetypes &&
            (!language.aliases || language.aliases.length === 0));
    }
    async registerLanguages(languages, baseUri) {
        const newLanguages = languages.map((language) => ({
            id: language.id,
            aliases: language.aliases,
            extensions: language.extensions,
            filenamePatterns: language.filenamePatterns,
            filenames: language.filenames,
            firstLine: language.firstLine,
            mimetypes: language.mimetypes,
        }));
        this.dynamicLanguages.push(...newLanguages.filter((lang) => !this.isEmbeddedLanguageOnly(lang)));
        /**
         * ModesRegistry.registerLanguage 性能很差
         */
        this.monacoLanguageService['_registry']['_registerLanguages'](newLanguages);
        languages.forEach(async (language) => {
            this.languageConfigLocation.set(language.id, baseUri);
            this.addDispose(monaco_api_1.monaco.languages.onLanguage(language.id, async () => {
                await this.loadLanguageConfiguration(language, baseUri);
                this.activateLanguage(language.id);
            }));
            this.languageConfiguration.set(language.id, language);
        });
        if (this.initialized) {
            const uris = this.editorDocumentModelService.getAllModels().map((m) => m.uri);
            for (const uri of uris) {
                const model = this.editorDocumentModelService.getModelReference(ide_core_common_1.URI.parse(uri.codeUri.toString()));
                if (model && model.instance) {
                    const langId = model.instance.getMonacoModel().getLanguageId();
                    if (this.languageConfiguration.has(langId)) {
                        await this.loadLanguageConfiguration(this.languageConfiguration.get(langId), baseUri);
                        this.activateLanguage(langId);
                    }
                }
                model === null || model === void 0 ? void 0 : model.dispose();
            }
        }
    }
    async registerGrammar(grammar, extPath) {
        if (grammar.path) {
            const grammarPath = grammar.path.replace(/^\.\//, '');
            // get content in `initGrammarRegistry`
            grammar.location = extPath.resolve(grammarPath);
        }
        this.doRegisterGrammar(grammar);
    }
    unregisterGrammar(grammar) {
        const toDispose = this.registeredGrammarDisposableCollection.get(grammar.scopeName);
        if (toDispose) {
            toDispose.dispose();
        }
    }
    doRegisterGrammar(grammar) {
        const toDispose = new ide_core_common_1.Disposable();
        if (grammar.injectTo) {
            for (const injectScope of grammar.injectTo) {
                let injections = this.injections.get(injectScope);
                if (!injections) {
                    injections = [];
                    toDispose.addDispose(ide_core_common_1.Disposable.create(() => {
                        this.injections.delete(injectScope);
                    }));
                    this.injections.set(injectScope, injections);
                }
                injections.push(grammar.scopeName);
            }
        }
        toDispose.addDispose(ide_core_common_1.Disposable.create(this.textmateRegistry.registerTextmateGrammarScope(grammar.scopeName, {
            async getGrammarDefinition() {
                return {
                    format: /\.json$/.test(grammar.path) ? 'json' : 'plist',
                    location: grammar.location,
                    content: await grammar.resolvedConfiguration,
                };
            },
            getInjections: (scopeName) => {
                const scopeParts = scopeName.split('.');
                let injections = [];
                for (let i = 1; i <= scopeParts.length; i++) {
                    const subScopeName = scopeParts.slice(0, i).join('.');
                    injections = [...injections, ...(this.injections.get(subScopeName) || [])];
                }
                return injections;
            },
        })));
        if (grammar.language) {
            toDispose.addDispose(ide_core_common_1.Disposable.create(this.textmateRegistry.mapLanguageIdToTextmateGrammar(grammar.language, grammar.scopeName)));
            toDispose.addDispose(ide_core_common_1.Disposable.create(this.textmateRegistry.registerGrammarConfiguration(grammar.language, () => ({
                embeddedLanguages: this.convertEmbeddedLanguages(grammar.embeddedLanguages),
                tokenTypes: this.convertTokenTypes(grammar.tokenTypes),
                balancedBracketSelectors: (0, arrays_1.asStringArray)(grammar.balancedBracketScopes, ['*']),
                unbalancedBracketSelectors: (0, arrays_1.asStringArray)(grammar.unbalancedBracketScopes, []),
            }))));
        }
        this.registeredGrammarDisposableCollection.set(grammar.scopeName, toDispose);
    }
    async loadLanguageConfiguration(language, baseUri) {
        let configuration;
        if (typeof language.resolvedConfiguration === 'object') {
            const config = await language.resolvedConfiguration;
            configuration = this.reviveLanguageConfiguration(language.id, config);
        }
        else if (language.configuration) {
            // remove `./` prefix
            const langPath = language.configuration.replace(/^\.\//, '');
            // http 的不作支持
            const configurationPath = baseUri.resolve(langPath);
            const ret = await this.fileServiceClient.resolveContent(configurationPath.toString());
            const content = ret.content;
            if (content) {
                const jsonContent = this.safeParseJSON(content);
                if (jsonContent) {
                    configuration = this.reviveLanguageConfiguration(language.id, jsonContent);
                }
            }
        }
        if (configuration) {
            monaco_api_1.monaco.languages.setLanguageConfiguration(language.id, configuration);
        }
    }
    async activateLanguage(languageId) {
        // 允许后来的插件上车
        this.eventBus.fire(new ide_core_browser_1.ExtensionActivateEvent({ topic: 'onLanguage', data: languageId }));
        if (this.activatedLanguage.has(languageId)) {
            return;
        }
        this.activatedLanguage.add(languageId);
        this.setTokensProviderByLanguageId(languageId);
    }
    async setTokensProviderByLanguageId(languageId) {
        const scopeName = this.textmateRegistry.getScope(languageId);
        if (!scopeName) {
            return;
        }
        const provider = this.textmateRegistry.getProvider(scopeName);
        if (!provider) {
            return;
        }
        const tokenizerOption = {
            lineLimit: this.preferenceService.getValid('editor.maxTokenizationLineLength', 20000),
        };
        const configuration = this.textmateRegistry.getGrammarConfiguration(languageId)();
        const initialLanguage = getEncodedLanguageId(languageId);
        try {
            const grammar = await this.grammarRegistry.loadGrammarWithConfiguration(scopeName, initialLanguage, configuration);
            const options = configuration.tokenizerOption ? configuration.tokenizerOption : tokenizerOption;
            const containsEmbeddedLanguages = configuration.embeddedLanguages && Object.keys(configuration.embeddedLanguages).length > 0;
            // 要保证grammar把所有的languageID关联的语法都注册好了
            if (grammar) {
                const tokenizer = new textmate_tokenizer_1.TextMateTokenizer(grammar, options, containsEmbeddedLanguages);
                this.addDispose(tokenizer.onDidEncounterLanguage(async (language) => {
                    // https://github.com/microsoft/vscode/blob/301f450d9260d6e1c900e7e93b85aae5151bf11c/src/vs/editor/common/services/languagesRegistry.ts#L140
                    const languageId = this.monacoLanguageService['_registry']['languageIdCodec']['decodeLanguageId'](language);
                    const location = this.languageConfigLocation.get(languageId);
                    if (location && this.languageConfiguration.has(languageId)) {
                        await this.loadLanguageConfiguration(this.languageConfiguration.get(languageId), location);
                        this.activateLanguage(languageId);
                    }
                }));
                monaco_api_1.monaco.languages.setTokensProvider(languageId, tokenizer);
            }
        }
        catch (error) {
            this.logger.warn('No grammar for this language id', languageId, error);
        }
    }
    setTheme(theme) {
        this.generateEncodedTokenColors(theme);
        monaco_api_1.monaco.editor.defineTheme(getLegalThemeName(theme.name), theme);
        monaco_api_1.monaco.editor.setTheme(getLegalThemeName(theme.name));
    }
    generateEncodedTokenColors(themeData) {
        // load时会转换customTokenColors
        this.grammarRegistry.setTheme(themeData);
        themeData.encodedTokensColors = this.grammarRegistry.getColorMap();
        // index 0 has to be set to null as it is 'undefined' by default, but monaco code expects it to be null
        themeData.encodedTokensColors[0] = null;
    }
    // 字符串转正则
    createRegex(value) {
        if (typeof value === 'string') {
            return new RegExp(value, '');
        }
        if ((0, ide_core_common_1.isObject)(value)) {
            if (typeof value.pattern !== 'string') {
                return undefined;
            }
            if (typeof value.flags !== 'undefined' && typeof value.flags !== 'string') {
                return undefined;
            }
            try {
                return new RegExp(value.pattern, value.flags);
            }
            catch (err) {
                return undefined;
            }
        }
        return undefined;
    }
    safeParseJSON(content) {
        let json;
        try {
            json = (0, ide_core_browser_1.parseWithComments)(content);
            return json;
        }
        catch (error) {
            this.logger.error(`Language configuration file parsing error, ${error.stack}`);
            return;
        }
    }
    // 将foldingRule里的字符串转为正则
    convertFolding(folding) {
        if (!folding) {
            return undefined;
        }
        const result = {
            offSide: folding.offSide,
        };
        if (folding.markers) {
            result.markers = {
                end: folding.markers.end,
                start: folding.markers.start,
            };
        }
        return result;
    }
    // 字符串定义转正则
    convertIndentationRules(rules) {
        if (!rules) {
            return undefined;
        }
        const result = {
            decreaseIndentPattern: this.createRegex(rules.decreaseIndentPattern),
            increaseIndentPattern: this.createRegex(rules.increaseIndentPattern),
        };
        if (rules.indentNextLinePattern) {
            result.indentNextLinePattern = this.createRegex(rules.indentNextLinePattern);
        }
        if (rules.unIndentedLinePattern) {
            result.unIndentedLinePattern = this.createRegex(rules.unIndentedLinePattern);
        }
        return result;
    }
    convertEmbeddedLanguages(languages) {
        if (typeof languages === 'undefined' || languages === null) {
            return undefined;
        }
        const result = Object.create(null);
        const scopes = Object.keys(languages);
        const len = scopes.length;
        for (let i = 0; i < len; i++) {
            const scope = scopes[i];
            const langId = languages[scope];
            result[scope] = getEncodedLanguageId(langId);
        }
        return result;
    }
    convertTokenTypes(tokenTypes) {
        if (typeof tokenTypes === 'undefined' || tokenTypes === null) {
            return undefined;
        }
        const result = Object.create(null);
        const scopes = Object.keys(tokenTypes);
        const len = scopes.length;
        for (let i = 0; i < len; i++) {
            const scope = scopes[i];
            const tokenType = tokenTypes[scope];
            switch (tokenType) {
                case 'string':
                    result[scope] = 2; // StandardTokenType.String;
                    break;
                case 'other':
                    result[scope] = 0; // StandardTokenType.Other;
                    break;
                case 'comment':
                    result[scope] = 1; // StandardTokenType.Comment;
                    break;
            }
        }
        return result;
    }
    extractValidSurroundingPairs(languageId, configuration) {
        if (!configuration) {
            return;
        }
        const source = configuration.surroundingPairs;
        if (typeof source === 'undefined') {
            return;
        }
        if (!Array.isArray(source)) {
            this.logger.warn(`[${languageId}: language configuration: expected \`surroundingPairs\` to be an array.`);
            return;
        }
        let result;
        for (let i = 0, len = source.length; i < len; i++) {
            const pair = source[i];
            if (Array.isArray(pair)) {
                if (!isCharacterPair(pair)) {
                    this.logger.warn(`[${languageId}: language configuration: expected \`surroundingPairs[${i}]\` to be an array of two strings or an object.`);
                    continue;
                }
                result = result || [];
                result.push({ open: pair[0], close: pair[1] });
            }
            else {
                if (typeof pair !== 'object') {
                    this.logger.warn(`[${languageId}: language configuration: expected \`surroundingPairs[${i}]\` to be an array of two strings or an object.`);
                    continue;
                }
                if (typeof pair.open !== 'string') {
                    this.logger.warn(`[${languageId}: language configuration: expected \`surroundingPairs[${i}].open\` to be a string.`);
                    continue;
                }
                if (typeof pair.close !== 'string') {
                    this.logger.warn(`[${languageId}: language configuration: expected \`surroundingPairs[${i}].close\` to be a string.`);
                    continue;
                }
                result = result || [];
                result.push({ open: pair.open, close: pair.close });
            }
        }
        return result;
    }
    extractValidColorizedBracketPairs(languageId, configuration) {
        const source = configuration.colorizedBracketPairs;
        if (typeof source === 'undefined') {
            return undefined;
        }
        if (!Array.isArray(source)) {
            this.logger.warn(`[${languageId}]: language configuration: expected \`colorizedBracketPairs\` to be an array.`);
            return undefined;
        }
        const result = [];
        for (let i = 0, len = source.length; i < len; i++) {
            const pair = source[i];
            if (!isCharacterPair(pair)) {
                this.logger.warn(`[${languageId}]: language configuration: expected \`colorizedBracketPairs[${i}]\` to be an array of two strings.`);
                continue;
            }
            result.push([pair[0], pair[1]]);
        }
        return result;
    }
    extractValidOnEnterRules(languageId, configuration) {
        const source = configuration.onEnterRules;
        if (typeof source === 'undefined') {
            return undefined;
        }
        if (!Array.isArray(source)) {
            this.logger.warn(`[${languageId}]: language configuration: expected \`onEnterRules\` to be an array.`);
            return undefined;
        }
        let result;
        for (let i = 0, len = source.length; i < len; i++) {
            const onEnterRule = source[i];
            if (!(0, ide_core_common_1.isObject)(onEnterRule)) {
                this.logger.warn(`[${languageId}]: language configuration: expected \`onEnterRules[${i}]\` to be an object.`);
                continue;
            }
            if (!(0, ide_core_common_1.isObject)(onEnterRule.action)) {
                this.logger.warn(`[${languageId}]: language configuration: expected \`onEnterRules[${i}].action\` to be an object.`);
                continue;
            }
            let indentAction;
            if (onEnterRule.action.indent === 'none') {
                indentAction = common_2.IndentAction.None;
            }
            else if (onEnterRule.action.indent === 'indent') {
                indentAction = common_2.IndentAction.Indent;
            }
            else if (onEnterRule.action.indent === 'indentOutdent') {
                indentAction = common_2.IndentAction.IndentOutdent;
            }
            else if (onEnterRule.action.indent === 'outdent') {
                indentAction = common_2.IndentAction.Outdent;
            }
            else {
                this.logger.warn(`[${languageId}]: language configuration: expected \`onEnterRules[${i}].action.indent\` to be 'none', 'indent', 'indentOutdent' or 'outdent'.`);
                continue;
            }
            const action = { indentAction };
            if (onEnterRule.action.appendText) {
                if (typeof onEnterRule.action.appendText === 'string') {
                    action.appendText = onEnterRule.action.appendText;
                }
                else {
                    this.logger.warn(`[${languageId}]: language configuration: expected \`onEnterRules[${i}].action.appendText\` to be undefined or a string.`);
                }
            }
            if (onEnterRule.action.removeText) {
                if (typeof onEnterRule.action.removeText === 'number') {
                    action.removeText = onEnterRule.action.removeText;
                }
                else {
                    this.logger.warn(`[${languageId}]: language configuration: expected \`onEnterRules[${i}].action.removeText\` to be undefined or a number.`);
                }
            }
            const beforeText = this.createRegex(onEnterRule.beforeText);
            if (!beforeText) {
                continue;
            }
            const resultingOnEnterRule = { beforeText, action };
            if (onEnterRule.afterText) {
                const afterText = this.createRegex(onEnterRule.afterText);
                if (afterText) {
                    resultingOnEnterRule.afterText = afterText;
                }
            }
            if (onEnterRule.previousLineText) {
                const previousLineText = this.createRegex(onEnterRule.previousLineText);
                if (previousLineText) {
                    resultingOnEnterRule.previousLineText = previousLineText;
                }
            }
            result = result || [];
            result.push(resultingOnEnterRule);
        }
        return result;
    }
    extractValidBrackets(languageId, configuration) {
        const source = configuration.brackets;
        if (typeof source === 'undefined') {
            return undefined;
        }
        if (!Array.isArray(source)) {
            this.logger.warn(`[${languageId}]: language configuration: expected \`brackets\` to be an array.`);
            return undefined;
        }
        let result;
        for (let i = 0, len = source.length; i < len; i++) {
            const pair = source[i];
            if (!isCharacterPair(pair)) {
                this.logger.warn(`[${languageId}]: language configuration: expected \`brackets[${i}]\` to be an array of two strings.`);
                continue;
            }
            result = result || [];
            result.push(pair);
        }
        return result;
    }
    extractValidAutoClosingPairs(languageId, configuration) {
        const source = configuration.autoClosingPairs;
        if (typeof source === 'undefined') {
            return undefined;
        }
        if (!Array.isArray(source)) {
            this.logger.warn(`[${languageId}]: language configuration: expected \`autoClosingPairs\` to be an array.`);
            return undefined;
        }
        let result;
        for (let i = 0, len = source.length; i < len; i++) {
            const pair = source[i];
            if (Array.isArray(pair)) {
                if (!isCharacterPair(pair)) {
                    this.logger.warn(`[${languageId}]: language configuration: expected \`autoClosingPairs[${i}]\` to be an array of two strings or an object.`);
                    continue;
                }
                result = result || [];
                result.push({ open: pair[0], close: pair[1] });
            }
            else {
                if (typeof pair !== 'object') {
                    this.logger.warn(`[${languageId}]: language configuration: expected \`autoClosingPairs[${i}]\` to be an array of two strings or an object.`);
                    continue;
                }
                if (typeof pair.open !== 'string') {
                    this.logger.warn(`[${languageId}]: language configuration: expected \`autoClosingPairs[${i}].open\` to be a string.`);
                    continue;
                }
                if (typeof pair.close !== 'string') {
                    this.logger.warn(`[${languageId}]: language configuration: expected \`autoClosingPairs[${i}].close\` to be a string.`);
                    continue;
                }
                if (typeof pair.notIn !== 'undefined') {
                    if (!isStringArr(pair.notIn)) {
                        this.logger.warn(`[${languageId}]: language configuration: expected \`autoClosingPairs[${i}].notIn\` to be a string array.`);
                        continue;
                    }
                }
                result = result || [];
                result.push({ open: pair.open, close: pair.close, notIn: pair.notIn });
            }
        }
        return result;
    }
    extractValidCommentRule(languageId, configuration) {
        const source = configuration.comments;
        if (typeof source === 'undefined') {
            return undefined;
        }
        if (typeof source !== 'object') {
            this.logger.warn(`[${languageId}]: language configuration: expected \`comments\` to be an object.`);
            return undefined;
        }
        let result;
        if (typeof source.lineComment !== 'undefined') {
            if (typeof source.lineComment !== 'string') {
                this.logger.warn(`[${languageId}]: language configuration: expected \`comments.lineComment\` to be a string.`);
            }
            else {
                result = result || {};
                result.lineComment = source.lineComment;
            }
        }
        if (typeof source.blockComment !== 'undefined') {
            if (!isCharacterPair(source.blockComment)) {
                this.logger.warn(`[${languageId}]: language configuration: expected \`comments.blockComment\` to be an array of two strings.`);
            }
            else {
                result = result || {};
                result.blockComment = source.blockComment;
            }
        }
        return result;
    }
    async initGrammarRegistry() {
        this.grammarRegistry = new vscode_textmate_1.Registry({
            onigLib: this.getOnigLib(),
            loadGrammar: async (scopeName) => {
                const provider = this.textmateRegistry.getProvider(scopeName);
                if (provider) {
                    const definition = await provider.getGrammarDefinition();
                    if (!definition.content) {
                        const ret = await this.fileServiceClient.resolveContent(definition.location.toString());
                        const content = ret.content;
                        definition.content = definition.format === 'json' ? this.safeParseJSON(content) : content;
                    }
                    let rawGrammar;
                    if (typeof definition.content === 'string') {
                        rawGrammar = (0, vscode_textmate_1.parseRawGrammar)(definition.content, definition.format === 'json' ? 'grammar.json' : 'grammar.plist');
                    }
                    else {
                        rawGrammar = definition.content;
                    }
                    return rawGrammar;
                }
                return undefined;
            },
            getInjections: (scopeName) => {
                const provider = this.textmateRegistry.getProvider(scopeName);
                if (provider && provider.getInjections) {
                    return provider.getInjections(scopeName);
                }
                return [];
            },
        });
        this.activateLanguages();
    }
    getLanguages() {
        return [...monaco_api_1.monaco.languages.getLanguages(), ...this.dynamicLanguages];
    }
    activateLanguages() {
        for (const { id: languageId } of this.getLanguages()) {
            if (this.editorDocumentModelService.hasLanguage(languageId)) {
                this.activateLanguage(languageId);
            }
        }
    }
    async getOnigLib() {
        // loadWasm 二次加载会报错 https://github.com/microsoft/vscode-oniguruma/blob/main/src/index.ts#L378
        if (wasmLoaded) {
            return new OnigasmLib();
        }
        let wasmUri;
        if (this.appConfig.isElectronRenderer && ide_core_browser_1.electronEnv.onigWasmPath) {
            wasmUri = ide_core_common_1.URI.file(ide_core_browser_1.electronEnv.onigWasmPath).codeUri.toString();
        }
        else if (this.appConfig.isElectronRenderer && ide_core_browser_1.electronEnv.onigWasmUri) {
            wasmUri = ide_core_browser_1.electronEnv.onigWasmUri;
        }
        else {
            wasmUri =
                this.appConfig.onigWasmUri ||
                    this.appConfig.onigWasmPath ||
                    'https://g.alicdn.com/kaitian/vscode-oniguruma-wasm/1.5.1/onig.wasm';
        }
        const response = await fetch(wasmUri);
        const bytes = await response.arrayBuffer();
        await (0, vscode_oniguruma_1.loadWASM)(bytes);
        wasmLoaded = true;
        return new OnigasmLib();
    }
    listenPreferenceChange() {
        this.preferenceService.onPreferenceChanged((e) => {
            if (e.preferenceName === 'editor.maxTokenizationLineLength') {
                for (const languageId of this.activatedLanguage) {
                    this.setTokensProviderByLanguageId(languageId);
                }
            }
        });
    }
    async testTokenize(line, languageId) {
        const scopeName = this.textmateRegistry.getScope(languageId);
        if (!scopeName) {
            return;
        }
        const configuration = this.textmateRegistry.getGrammarConfiguration(languageId)();
        const initialLanguage = getEncodedLanguageId(languageId);
        const grammar = (await this.grammarRegistry.loadGrammarWithConfiguration(scopeName, initialLanguage, configuration));
        let ruleStack = vscode_textmate_1.INITIAL;
        const lineTokens = grammar.tokenizeLine(line, ruleStack);
        const debugLogger = (0, ide_core_browser_1.getDebugLogger)('tokenize');
        debugLogger.log(`\nTokenizing line: ${line}`);
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let j = 0; j < lineTokens.tokens.length; j++) {
            const token = lineTokens.tokens[j];
            debugLogger.log(` - token from ${token.startIndex} to ${token.endIndex} ` +
                `(${line.substring(token.startIndex, token.endIndex)}) ` +
                `with scopes ${token.scopes.join(', ')}`);
        }
        ruleStack = lineTokens.ruleStack;
    }
    dispose() {
        super.dispose();
        this.monacoLanguageService['_encounteredLanguages'].clear();
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(),
    tslib_1.__metadata("design:type", textmate_registry_1.TextmateRegistry)
], TextmateService.prototype, "textmateRegistry", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(common_1.IFileServiceClient),
    tslib_1.__metadata("design:type", Object)
], TextmateService.prototype, "fileServiceClient", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.PreferenceService),
    tslib_1.__metadata("design:type", Object)
], TextmateService.prototype, "preferenceService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.ILogger),
    tslib_1.__metadata("design:type", Object)
], TextmateService.prototype, "logger", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(types_1.IEditorDocumentModelService),
    tslib_1.__metadata("design:type", Object)
], TextmateService.prototype, "editorDocumentModelService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.AppConfig),
    tslib_1.__metadata("design:type", Object)
], TextmateService.prototype, "appConfig", void 0);
TextmateService = tslib_1.__decorate([
    (0, di_1.Injectable)()
], TextmateService);
exports.TextmateService = TextmateService;
//# sourceMappingURL=textmate.service.js.map