"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorElectronContribution = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const ide_core_common_1 = require("@opensumi/ide-core-common");
const electron_1 = require("@opensumi/ide-core-common/lib/electron");
const common_1 = require("../common");
const types_1 = require("./doc-model/types");
const types_2 = require("./types");
const workbench_editor_service_1 = require("./workbench-editor.service");
let EditorElectronContribution = class EditorElectronContribution extends ide_core_common_1.WithEventBus {
    onResourceDecorationChangeEvent() {
        const hasDirty = this.workbenchEditorService.hasDirty();
        // setup macos native dirty indicator
        this.electronMainUIService.setDocumentEdited(ide_core_browser_1.electronEnv.currentWindowId, hasDirty ? true : false);
    }
    /**
     * Return true in order to prevent exit
     */
    async onWillStop(app) {
        if (await this.workbenchEditorService.closeAllOnlyConfirmOnce()) {
            return true;
        }
        if (!this.cacheProvider.isFlushed()) {
            return true;
        }
        return false;
    }
    registerKeybindings(keybindings) {
        keybindings.registerKeybinding({
            command: ide_core_browser_1.EDITOR_COMMANDS.NEXT.id,
            keybinding: 'ctrl+tab',
        });
        keybindings.registerKeybinding({
            command: ide_core_browser_1.EDITOR_COMMANDS.PREVIOUS.id,
            keybinding: 'ctrl+shift+tab',
        });
        if (ide_core_common_1.isOSX) {
            keybindings.registerKeybinding({
                command: ide_core_browser_1.EDITOR_COMMANDS.NEXT.id,
                keybinding: 'ctrlcmd+shift+]',
            });
            keybindings.registerKeybinding({
                command: ide_core_browser_1.EDITOR_COMMANDS.PREVIOUS.id,
                keybinding: 'ctrlcmd+shift+[',
            });
        }
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(di_1.INJECTOR_TOKEN),
    tslib_1.__metadata("design:type", di_1.Injector)
], EditorElectronContribution.prototype, "injector", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(common_1.WorkbenchEditorService),
    tslib_1.__metadata("design:type", workbench_editor_service_1.WorkbenchEditorServiceImpl)
], EditorElectronContribution.prototype, "workbenchEditorService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(common_1.IDocPersistentCacheProvider),
    tslib_1.__metadata("design:type", Object)
], EditorElectronContribution.prototype, "cacheProvider", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(types_1.IEditorDocumentModelContentRegistry),
    tslib_1.__metadata("design:type", Object)
], EditorElectronContribution.prototype, "contentRegistry", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(electron_1.IElectronMainUIService),
    tslib_1.__metadata("design:type", Object)
], EditorElectronContribution.prototype, "electronMainUIService", void 0);
tslib_1.__decorate([
    (0, ide_core_common_1.OnEvent)(types_2.ResourceDecorationChangeEvent),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], EditorElectronContribution.prototype, "onResourceDecorationChangeEvent", null);
EditorElectronContribution = tslib_1.__decorate([
    (0, ide_core_browser_1.Domain)(ide_core_browser_1.ClientAppContribution, ide_core_browser_1.KeybindingContribution)
], EditorElectronContribution);
exports.EditorElectronContribution = EditorElectronContribution;
//# sourceMappingURL=editor-electron.contribution.js.map