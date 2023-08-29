"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUpdateOnGroupTabChange = void 0;
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
function useUpdateOnGroupTabChange(editorGroup) {
    return (0, ide_core_browser_1.useUpdateOnEvent)(editorGroup.onDidEditorGroupTabChanged, [editorGroup]);
}
exports.useUpdateOnGroupTabChange = useUpdateOnGroupTabChange;
//# sourceMappingURL=react-hook.js.map