/** ******************************************************************************
 * Copyright (C) 2018 Ericsson and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import { IGrammarConfiguration } from 'vscode-textmate';
import { URI } from '@opensumi/ide-core-common';
import { TokenizerOption } from './textmate-tokenizer';
export interface TextmateGrammarConfiguration extends IGrammarConfiguration {
    /**
     * Optional options to further refine the tokenization of the grammar.
     */
    readonly tokenizerOption?: TokenizerOption;
}
export interface GrammarDefinitionProvider {
    getGrammarDefinition(): Promise<GrammarDefinition>;
    getInjections?(scopeName: string): string[];
}
export interface GrammarDefinition {
    format: 'json' | 'plist';
    content?: object | string;
    location: URI;
}
export declare class TextmateRegistry {
    readonly scopeToProvider: Map<string, GrammarDefinitionProvider>;
    readonly languageToConfig: Map<string, () => TextmateGrammarConfiguration>;
    readonly languageIdToScope: Map<string, string>;
    registerTextmateGrammarScope(scope: string, description: GrammarDefinitionProvider): () => void;
    getProvider(scope: string): GrammarDefinitionProvider | undefined;
    mapLanguageIdToTextmateGrammar(languageId: string, scope: string): () => void;
    getScope(languageId: string): string | undefined;
    getLanguageId(scope: string): string | undefined;
    registerGrammarConfiguration(languageId: string, getConfig: () => TextmateGrammarConfiguration): () => void;
    getGrammarConfiguration(languageId: string): () => TextmateGrammarConfiguration;
}
//# sourceMappingURL=textmate-registry.d.ts.map