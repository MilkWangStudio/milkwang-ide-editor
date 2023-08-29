"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonacoModelDiagnostics = exports.MonacoDiagnosticCollection = void 0;
const tslib_1 = require("tslib");
const monaco = tslib_1.__importStar(require("@opensumi/monaco-editor-core/esm/vs/editor/editor.api"));
// eslint-disable-next-line import/order
const ide_core_common_1 = require("@opensumi/ide-core-common");
// eslint-disable-next-line import/order
const common_1 = require("../../common");
class MonacoDiagnosticCollection {
    constructor(name) {
        this.name = name;
        this.diagnostics = new Map();
        this.toDispose = new ide_core_common_1.DisposableCollection();
    }
    dispose() {
        this.toDispose.dispose();
    }
    get(uri) {
        const diagnostics = this.diagnostics.get(uri);
        return diagnostics ? diagnostics.diagnostics : [];
    }
    set(uri, diagnostics) {
        const existing = this.diagnostics.get(uri);
        if (existing) {
            existing.diagnostics = diagnostics;
        }
        else {
            const modelDiagnostics = new MonacoModelDiagnostics(uri, diagnostics, this.name);
            this.diagnostics.set(uri, modelDiagnostics);
            this.toDispose.push(ide_core_common_1.Disposable.create(() => {
                this.diagnostics.delete(uri);
                modelDiagnostics.dispose();
            }));
        }
    }
}
exports.MonacoDiagnosticCollection = MonacoDiagnosticCollection;
class MonacoModelDiagnostics {
    constructor(uri, diagnostics, owner) {
        this.owner = owner;
        this._markers = [];
        this._diagnostics = [];
        this.uri = monaco.Uri.parse(uri);
        this.diagnostics = diagnostics;
        monaco.editor.onDidCreateModel((model) => this.doUpdateModelMarkers(model));
    }
    set diagnostics(diagnostics) {
        this._diagnostics = diagnostics;
        this._markers = (0, common_1.asMonacoDiagnostics)(diagnostics) || [];
        this.updateModelMarkers();
    }
    get diagnostics() {
        return this._diagnostics;
    }
    get markers() {
        return this._markers;
    }
    dispose() {
        this._markers = [];
        this.updateModelMarkers();
    }
    updateModelMarkers() {
        const model = monaco.editor.getModel(this.uri);
        this.doUpdateModelMarkers(model);
    }
    doUpdateModelMarkers(model) {
        if (model && this.uri.toString() === model.uri.toString()) {
            monaco.editor.setModelMarkers(model, this.owner, this._markers);
        }
    }
}
exports.MonacoModelDiagnostics = MonacoModelDiagnostics;
//# sourceMappingURL=diagnostic-collection.js.map