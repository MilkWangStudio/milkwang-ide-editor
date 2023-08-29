import { StackElement, IGrammar } from 'vscode-textmate';
import { Disposable, Event } from '@opensumi/ide-core-common/lib/utils';
import * as monaco from '@opensumi/monaco-editor-core/esm/vs/editor/editor.api';
export declare class TokenizerState implements monaco.languages.IState {
    readonly ruleStack: StackElement;
    constructor(ruleStack: StackElement);
    clone(): monaco.languages.IState;
    equals(other: monaco.languages.IState): boolean;
}
/**
 * Options for the TextMate tokenizer.
 */
export interface TokenizerOption {
    /**
     * Maximum line length that will be handled by the TextMate tokenizer. If the length of the actual line exceeds this
     * limit, the tokenizer terminates and the tokenization of any subsequent lines might be broken.
     *
     * If the `lineLimit` is not defined, it means, there are no line length limits. Otherwise, it must be a positive
     * integer or an error will be thrown.
     */
    readonly lineLimit?: number;
}
export declare class TextMateTokenizer extends Disposable implements monaco.languages.EncodedTokensProvider {
    private readonly grammar;
    private readonly options;
    private readonly conatinsEmbeddedLanguages?;
    private readonly seenLanguages;
    private readonly onDidEncounterLanguageEmitter;
    readonly onDidEncounterLanguage: Event<number>;
    constructor(grammar: IGrammar, options: TokenizerOption, conatinsEmbeddedLanguages?: boolean | undefined);
    getInitialState(): monaco.languages.IState;
    tokenizeEncoded(line: string, state: TokenizerState): monaco.languages.IEncodedLineTokens;
    tokenize?(line: string, state: TokenizerState): monaco.languages.ILineTokens;
}
//# sourceMappingURL=textmate-tokenizer.d.ts.map