"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MergeEditorFloatComponents = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importStar(require("react"));
const ide_components_1 = require("@opensumi/ide-components");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const ide_core_browser_2 = require("@opensumi/ide-core-browser");
const editor_module_less_1 = tslib_1.__importDefault(require("../editor.module.less"));
const MergeEditorFloatComponents = ({ resource }) => {
    const commandService = (0, ide_core_browser_2.useInjectable)(ide_core_browser_1.CommandService);
    const commandRegistry = (0, ide_core_browser_2.useInjectable)(ide_core_browser_1.CommandRegistry);
    const handleOpenMergeEditor = (0, react_1.useCallback)(async () => {
        const { uri } = resource;
        [ide_core_browser_1.SCM_COMMANDS.GIT_OPEN_MERGE_EDITOR, ide_core_browser_1.SCM_COMMANDS._GIT_OPEN_MERGE_EDITOR].forEach(({ id: command }) => {
            if (commandRegistry.getCommand(command) && commandRegistry.isEnabled(command)) {
                commandService.executeCommand(command, uri);
            }
        });
    }, [resource]);
    return (react_1.default.createElement("div", { className: editor_module_less_1.default.merge_editor_float_container },
        react_1.default.createElement(ide_components_1.Button, { size: 'large', onClick: handleOpenMergeEditor }, (0, ide_core_browser_1.localize)('mergeEditor.open.in.editor'))));
};
exports.MergeEditorFloatComponents = MergeEditorFloatComponents;
//# sourceMappingURL=MergeEditorFloatComponents.js.map