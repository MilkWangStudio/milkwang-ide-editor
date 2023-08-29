/// <reference types="vscode" />
import LSTypes from 'vscode-languageserver-types';
import { MarkerSeverity } from '@opensumi/ide-core-common';
import { CancellationToken, IDisposable, IRelativePattern } from '@opensumi/ide-core-common';
import { URI as Uri } from '@opensumi/monaco-editor-core/esm/vs/base/common/uri';
import { editor } from '@opensumi/monaco-editor-core/esm/vs/editor/editor.api';
import type { IRelatedInformation } from '@opensumi/monaco-editor-core/esm/vs/platform/markers/common/markers';
export declare const ILanguageService: unique symbol;
export interface ILanguageService {
    languages: Language[];
    workspaceSymbolProviders: WorkspaceSymbolProvider[];
    getLanguage(languageId: string): Language | undefined;
    registerWorkspaceSymbolProvider(provider: WorkspaceSymbolProvider): IDisposable;
}
export interface DiagnosticCollection extends IDisposable {
    set(uri: string, diagnostics: Diagnostic[]): void;
}
/**
 * Represents a related message and source code location for a diagnostic. This should be
 * used to point to code locations that cause or related to a diagnostics, e.g when duplicating
 * a symbol in a scope.
 */
export interface DiagnosticRelatedInformation {
    /**
     * The location of this related diagnostic information.
     */
    location: LSTypes.Location;
    /**
     * The message of this related diagnostic information.
     */
    message: string;
}
/**
 * The DiagnosticRelatedInformation namespace provides helper functions to work with
 * [DiagnosticRelatedInformation](#DiagnosticRelatedInformation) literals.
 */
export declare namespace DiagnosticRelatedInformation {
    /**
     * Creates a new DiagnosticRelatedInformation literal.
     */
    function create(location: Location, message: string): DiagnosticRelatedInformation;
    /**
     * Checks whether the given literal conforms to the [DiagnosticRelatedInformation](#DiagnosticRelatedInformation) interface.
     */
    function is(value: any): value is DiagnosticRelatedInformation;
}
export declare enum DiagnosticSeverity {
    Error = 1,
    Warning = 2,
    Information = 3,
    Hint = 4
}
/**
 * Represents a diagnostic, such as a compiler error or warning. Diagnostic objects
 * are only valid in the scope of a resource.
 */
export interface Diagnostic {
    /**
     * The range at which the message applies
     */
    range: LSTypes.Range;
    /**
     * The diagnostic's severity. Can be omitted. If omitted it is up to the
     * client to interpret diagnostics as error, warning, info or hint.
     */
    severity: DiagnosticSeverity;
    /**
     * A code or identifier for this diagnostic.
     * Should be used for later processing, e.g. when providing {@link CodeActionContext code actions}.
     */
    code?: string | number | {
        /**
         * A code or identifier for this diagnostic.
         * Should be used for later processing, e.g. when providing {@link CodeActionContext code actions}.
         */
        value: string | number;
        /**
         * A target URI to open with more information about the diagnostic error.
         */
        target: Uri;
    };
    /**
     * A human-readable string describing the source of this
     * diagnostic, e.g. 'typescript' or 'super lint'.
     */
    source?: string;
    /**
     * The diagnostic's message.
     */
    message: string;
    /**
     * An array of related diagnostic information, e.g. when symbol-names within
     * a scope collide all definitions can be marked via this property.
     */
    relatedInformation?: DiagnosticRelatedInformation[];
    tags?: DiagnosticTag[];
}
export declare enum DiagnosticTag {
    Unnecessary = 1,
    Deprecated = 2
}
export declare function asSeverity(severity?: number): MarkerSeverity;
export declare function asRelatedInformations(relatedInformation?: DiagnosticRelatedInformation[]): IRelatedInformation[] | undefined;
export declare function asRelatedInformation(relatedInformation: DiagnosticRelatedInformation): IRelatedInformation;
export declare function asMonacoDiagnostics(diagnostics: Diagnostic[] | undefined): editor.IMarkerData[] | undefined;
export declare function asMonacoDiagnostic(diagnostic: Diagnostic): editor.IMarkerData;
export interface WorkspaceSymbolParams {
    query: string;
}
export interface WorkspaceSymbolProvider {
    provideWorkspaceSymbols(params: WorkspaceSymbolParams, token: CancellationToken): Thenable<LSTypes.SymbolInformation[]>;
    resolveWorkspaceSymbol(symbol: LSTypes.SymbolInformation, token: CancellationToken): Thenable<LSTypes.SymbolInformation>;
}
export interface Language {
    readonly id: string;
    readonly name: string;
    readonly extensions: Set<string>;
    readonly filenames: Set<string>;
}
export interface LanguageFilter {
    language?: string;
    scheme?: string;
    pattern?: string | IRelativePattern;
    hasAccessToAllModels?: boolean;
}
export type LanguageSelector = string | LanguageFilter | (string | LanguageFilter)[];
//# sourceMappingURL=language.d.ts.map