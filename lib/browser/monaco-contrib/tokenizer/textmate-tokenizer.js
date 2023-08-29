"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextMateTokenizer = exports.TokenizerState = void 0;
const vscode_textmate_1 = require("vscode-textmate");
const utils_1 = require("@opensumi/ide-core-common/lib/utils");
const encodedTokenAttributes_1 = require("@opensumi/monaco-editor-core/esm/vs/editor/common/encodedTokenAttributes");
class TokenizerState {
    constructor(ruleStack) {
        this.ruleStack = ruleStack;
    }
    clone() {
        return new TokenizerState(this.ruleStack);
    }
    equals(other) {
        return other instanceof TokenizerState && (other === this || other.ruleStack === this.ruleStack);
    }
}
exports.TokenizerState = TokenizerState;
class TextMateTokenizer extends utils_1.Disposable {
    constructor(grammar, options, conatinsEmbeddedLanguages) {
        super();
        this.grammar = grammar;
        this.options = options;
        this.conatinsEmbeddedLanguages = conatinsEmbeddedLanguages;
        this.onDidEncounterLanguageEmitter = new utils_1.Emitter();
        this.onDidEncounterLanguage = this.onDidEncounterLanguageEmitter.event;
        this.seenLanguages = [];
    }
    getInitialState() {
        return new TokenizerState(vscode_textmate_1.INITIAL);
    }
    tokenizeEncoded(line, state) {
        // copied from vscode/src/vs/editor/common/modes/nullMode.ts
        if (this.options.lineLimit !== undefined && line.length > this.options.lineLimit) {
            const tokens = new Uint32Array(2);
            tokens[0] = 0;
            tokens[1] =
                (1 << encodedTokenAttributes_1.MetadataConsts.LANGUAGEID_OFFSET) |
                    (0 << encodedTokenAttributes_1.MetadataConsts.TOKEN_TYPE_OFFSET) |
                    (0 << encodedTokenAttributes_1.MetadataConsts.FONT_STYLE_OFFSET) |
                    (1 << encodedTokenAttributes_1.MetadataConsts.FOREGROUND_OFFSET) |
                    (2 << encodedTokenAttributes_1.MetadataConsts.BACKGROUND_OFFSET) |
                    (encodedTokenAttributes_1.MetadataConsts.BALANCED_BRACKETS_MASK >>> 0);
            // Line is too long to be tokenized
            return {
                endState: new TokenizerState(vscode_textmate_1.INITIAL),
                tokens,
            };
        }
        const result = this.grammar.tokenizeLine2(line, state.ruleStack, 500);
        if (this.conatinsEmbeddedLanguages) {
            const seenLanguages = this.seenLanguages;
            const tokens = result.tokens;
            // Must check if any of the embedded languages was hit
            for (let i = 0, len = tokens.length >>> 1; i < len; i++) {
                const metadata = tokens[(i << 1) + 1];
                const languageId = encodedTokenAttributes_1.TokenMetadata.getLanguageId(metadata);
                if (!seenLanguages[languageId]) {
                    seenLanguages[languageId] = true;
                    this.onDidEncounterLanguageEmitter.fire(languageId);
                }
            }
        }
        return {
            endState: new TokenizerState(result.ruleStack),
            tokens: result.tokens,
        };
    }
    tokenize(line, state) {
        const result = this.grammar.tokenizeLine(line, state.ruleStack);
        return {
            endState: new TokenizerState(result.ruleStack),
            tokens: result.tokens.map((t) => (Object.assign(Object.assign({}, t), { scopes: t.scopes.join('\r\n') }))),
        };
    }
}
exports.TextMateTokenizer = TextMateTokenizer;
//# sourceMappingURL=textmate-tokenizer.js.map