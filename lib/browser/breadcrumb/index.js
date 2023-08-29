"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BreadCrumbServiceImpl = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const default_1 = require("./default");
const { addElement } = ide_core_browser_1.arrays;
let BreadCrumbServiceImpl = class BreadCrumbServiceImpl {
    constructor() {
        this.providers = [];
        this._onDidUpdateBreadCrumbResults = new ide_core_browser_1.Emitter();
        this.onDidUpdateBreadCrumbResults = this._onDidUpdateBreadCrumbResults.event;
        // editor-id / uriString
        this.crumbResults = new Map();
        this.registerBreadCrumbProvider(this.defaultBreadCrumbProvider);
    }
    registerBreadCrumbProvider(provider) {
        const disposer = addElement(this.providers, provider);
        provider.onDidUpdateBreadCrumb((uri) => {
            this.crumbResults.forEach((crumbResults, editor) => {
                if (crumbResults.has(uri.toString())) {
                    this.getBreadCrumbs(uri, editor);
                }
            });
        });
        return disposer;
    }
    getBreadCrumbs(uri, editor) {
        const editorCrumbResults = this.getEditorCrumbResults(editor);
        for (const provider of this.providers) {
            if (provider.handlesUri(uri)) {
                const lastCrumb = editorCrumbResults.get(uri.toString());
                const newCrumb = provider.provideBreadCrumbForUri(uri, editor);
                if (!isBreadCrumbArrayEqual(lastCrumb, newCrumb)) {
                    editorCrumbResults.set(uri.toString(), newCrumb);
                    this._onDidUpdateBreadCrumbResults.fire({ editor, uri });
                }
                break;
            }
        }
        return editorCrumbResults.get(uri.toString());
    }
    getEditorCrumbResults(editor) {
        if (!this.crumbResults.has(editor)) {
            this.crumbResults.set(editor, new Map());
            if (editor) {
                // todo IEditor 应该也暴露 onDispose
                editor.monacoEditor.onDidDispose(() => {
                    this.crumbResults.delete(editor);
                });
            }
        }
        return this.crumbResults.get(editor);
    }
    disposeCrumb(uri) {
        // this.crumbResults.delete(uri.toString());
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(),
    tslib_1.__metadata("design:type", default_1.DefaultBreadCrumbProvider)
], BreadCrumbServiceImpl.prototype, "defaultBreadCrumbProvider", void 0);
BreadCrumbServiceImpl = tslib_1.__decorate([
    (0, di_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [])
], BreadCrumbServiceImpl);
exports.BreadCrumbServiceImpl = BreadCrumbServiceImpl;
function isBreadCrumbArrayEqual(p1, p2) {
    if (!p1 && !p2) {
        return true;
    }
    else if (!p1 || !p2) {
        return false;
    }
    else {
        if (p1.length !== p2.length) {
            return false;
        }
        for (let i = 0; i < p1.length; i++) {
            if (!isBreadCrumbEqual(p1[i], p2[i])) {
                return false;
            }
        }
        return true;
    }
}
function isBreadCrumbEqual(p1, p2) {
    return p1.name === p2.name;
}
//# sourceMappingURL=index.js.map