"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeEditor = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importDefault(require("react"));
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const common_1 = require("../../common");
const types_1 = require("../doc-model/types");
const CodeEditor = (props) => {
    const container = react_1.default.useRef();
    const editorCollectionService = (0, ide_core_browser_1.useInjectable)(common_1.EditorCollectionService);
    const documentService = (0, ide_core_browser_1.useInjectable)(types_1.IEditorDocumentModelService);
    const [editor, setEditor] = react_1.default.useState(undefined);
    const [documentModelRef, setDocumentModelRef] = react_1.default.useState(undefined);
    const [uri, setUri] = react_1.default.useState(undefined);
    const [fetchingUri, setFetchingUri] = react_1.default.useState(undefined);
    let canceled = false;
    react_1.default.useEffect(() => {
        if (container.current) {
            if (editor) {
                editor.dispose();
            }
            const e = editorCollectionService.createCodeEditor(container.current, Object.assign({ automaticLayout: true }, props.options));
            setEditor(e);
            if (documentModelRef) {
                e.open(documentModelRef);
            }
        }
        return () => {
            canceled = true;
            if (editor) {
                editor.dispose();
            }
            if (documentModelRef) {
                documentModelRef.dispose();
            }
        };
    }, [container.current]);
    if (props && editor && props.editorRef) {
        props.editorRef(editor);
    }
    if (uri) {
        if (fetchingUri !== uri) {
            setFetchingUri(uri);
            documentService.createModelReference(new ide_core_browser_1.URI(uri), 'editor-react-component').then((ref) => {
                if (documentModelRef) {
                    documentModelRef.dispose();
                }
                if (!canceled && ref.instance.uri.toString() === uri) {
                    setDocumentModelRef(ref);
                }
                else {
                    ref.dispose();
                }
            });
        }
    }
    if (documentModelRef) {
        if (editor && editor.currentDocumentModel !== documentModelRef.instance) {
            editor.open(documentModelRef);
        }
    }
    if (props.uri && props.uri.toString() !== uri) {
        setUri(props.uri.toString());
    }
    return react_1.default.createElement("div", Object.assign({ ref: (el) => el && (container.current = el) }, props));
};
exports.CodeEditor = CodeEditor;
//# sourceMappingURL=editor.react.js.map