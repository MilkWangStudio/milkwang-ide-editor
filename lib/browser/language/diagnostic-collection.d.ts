import * as monaco from '@opensumi/monaco-editor-core/esm/vs/editor/editor.api';
import IMonacoModel = monaco.editor.IModel;
import IMonacoMarkerData = monaco.editor.IMarkerData;
import { DisposableCollection, IDisposable } from '@opensumi/ide-core-common';
import { DiagnosticCollection, Diagnostic } from '../../common';
export declare class MonacoDiagnosticCollection implements DiagnosticCollection {
    protected readonly name: string;
    protected readonly diagnostics: Map<string, MonacoModelDiagnostics | undefined>;
    protected readonly toDispose: DisposableCollection;
    constructor(name: string);
    dispose(): void;
    get(uri: string): Diagnostic[];
    set(uri: string, diagnostics: Diagnostic[]): void;
}
export declare class MonacoModelDiagnostics implements IDisposable {
    readonly owner: string;
    readonly uri: monaco.Uri;
    protected _markers: IMonacoMarkerData[];
    protected _diagnostics: Diagnostic[];
    constructor(uri: string, diagnostics: Diagnostic[], owner: string);
    set diagnostics(diagnostics: Diagnostic[]);
    get diagnostics(): Diagnostic[];
    get markers(): ReadonlyArray<IMonacoMarkerData>;
    dispose(): void;
    updateModelMarkers(): void;
    protected doUpdateModelMarkers(model: IMonacoModel | null): void;
}
//# sourceMappingURL=diagnostic-collection.d.ts.map