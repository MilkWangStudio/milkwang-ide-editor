import { Registry } from 'vscode-textmate';
import { WithEventBus, PreferenceService } from '@opensumi/ide-core-browser';
import { URI } from '@opensumi/ide-core-common';
import { GrammarsContribution, ITextmateTokenizerService } from '@opensumi/ide-monaco/lib/browser/contrib/tokenizer';
import { LanguagesContribution } from '@opensumi/ide-monaco/lib/common';
import { IThemeData } from '@opensumi/ide-theme';
import { ILanguageExtensionPoint } from '@opensumi/monaco-editor-core/esm/vs/editor/common/languages/language';
import { ILanguageService } from '@opensumi/monaco-editor-core/esm/vs/editor/common/languages/language';
import { IEditorDocumentModelService } from '../../doc-model/types';
export declare function getEncodedLanguageId(languageId: string): number;
export declare function getLegalThemeName(name: string): string;
export type CharacterPair = [string, string];
export declare class TextmateService extends WithEventBus implements ITextmateTokenizerService {
    private textmateRegistry;
    private fileServiceClient;
    preferenceService: PreferenceService;
    private logger;
    editorDocumentModelService: IEditorDocumentModelService;
    private readonly appConfig;
    grammarRegistry: Registry;
    private registeredGrammarDisposableCollection;
    private injections;
    private activatedLanguage;
    private languageConfigLocation;
    private languageConfiguration;
    initialized: boolean;
    private dynamicLanguages;
    private editorTheme?;
    /**
     * start contribution 做初始化
     */
    init(): void;
    listenThemeChange(): void;
    registerLanguage(language: LanguagesContribution, extPath: URI): Promise<void>;
    private reviveLanguageConfiguration;
    get monacoLanguageService(): ILanguageService;
    private isEmbeddedLanguageOnly;
    registerLanguages(languages: LanguagesContribution[], baseUri: URI): Promise<void>;
    registerGrammar(grammar: GrammarsContribution, extPath: URI): Promise<void>;
    unregisterGrammar(grammar: GrammarsContribution): void;
    doRegisterGrammar(grammar: GrammarsContribution): void;
    private loadLanguageConfiguration;
    activateLanguage(languageId: string): Promise<void>;
    private setTokensProviderByLanguageId;
    setTheme(theme: IThemeData): void;
    private generateEncodedTokenColors;
    private createRegex;
    private safeParseJSON;
    private convertFolding;
    private convertIndentationRules;
    private convertEmbeddedLanguages;
    private convertTokenTypes;
    private extractValidSurroundingPairs;
    private extractValidColorizedBracketPairs;
    private extractValidOnEnterRules;
    private extractValidBrackets;
    private extractValidAutoClosingPairs;
    private extractValidCommentRule;
    private initGrammarRegistry;
    getLanguages(): ILanguageExtensionPoint[];
    private activateLanguages;
    private getOnigLib;
    private listenPreferenceChange;
    testTokenize(line: string, languageId: string): Promise<void>;
    dispose(): void;
}
//# sourceMappingURL=textmate.service.d.ts.map