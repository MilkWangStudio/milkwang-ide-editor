"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorTopPaddingContribution = void 0;
class EditorTopPaddingContribution {
    contribute(editor) {
        return editor.monacoEditor.onDidChangeModel(() => {
            editor.monacoEditor.changeViewZones((accessor) => {
                accessor.addZone({
                    afterLineNumber: 0,
                    domNode: document.createElement('div'),
                    heightInPx: 0,
                });
            });
        });
    }
}
exports.EditorTopPaddingContribution = EditorTopPaddingContribution;
//# sourceMappingURL=topPadding.js.map