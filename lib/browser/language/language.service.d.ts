import { URI, IDisposable, IMarkerData } from '@opensumi/ide-core-common';
import * as monaco from '@opensumi/monaco-editor-core/esm/vs/editor/editor.api';
import { Diagnostic, Language, WorkspaceSymbolProvider, ILanguageService } from '../../common';
import { MonacoDiagnosticCollection } from './diagnostic-collection';
export type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};
export declare function reviveMarker(marker: IMarkerData): Diagnostic;
export declare class LanguageService implements ILanguageService {
    private markerManager;
    private textmateService;
    protected readonly markers: Map<string, MonacoDiagnosticCollection>;
    readonly workspaceSymbolProviders: WorkspaceSymbolProvider[];
    constructor();
    get languages(): Language[];
    getLanguage(languageId: string): Language | undefined;
    protected mergeLanguages(registered: monaco.languages.ILanguageExtensionPoint[]): Map<string, Mutable<Language>>;
    registerWorkspaceSymbolProvider(provider: WorkspaceSymbolProvider): IDisposable;
    protected updateMarkers(uri: URI): void;
}
//# sourceMappingURL=language.service.d.ts.map