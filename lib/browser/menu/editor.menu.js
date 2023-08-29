"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorActionRegistryImpl = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const next_1 = require("@opensumi/ide-core-browser/lib/menu/next");
let EditorActionRegistryImpl = class EditorActionRegistryImpl extends ide_core_browser_1.Disposable {
    constructor() {
        super(...arguments);
        this._cachedMenus = new Map();
    }
    registerEditorAction() {
        this.logger.warn(new Error('registerEditorAction has been deprecated, use menu apis instead'));
        return new ide_core_browser_1.Disposable();
    }
    getMenu(group) {
        const key = group.currentFocusedEditor
            ? 'editor-menu-' + group.currentFocusedEditor.getId()
            : 'editor-group-menu-' + group.name;
        if (!this._cachedMenus.has(key)) {
            const contextKeyService = group.currentFocusedEditor
                ? this.contextKeyService.createScoped(group.currentFocusedEditor.monacoEditor._contextKeyService)
                : group.contextKeyService;
            const menus = this.registerDispose(this.menuService.createMenu({
                id: next_1.MenuId.EditorTitle,
                contextKeyService,
            }));
            this._cachedMenus.set(key, menus);
        }
        return this._cachedMenus.get(key);
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.IContextKeyService),
    tslib_1.__metadata("design:type", Object)
], EditorActionRegistryImpl.prototype, "contextKeyService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(next_1.AbstractContextMenuService),
    tslib_1.__metadata("design:type", next_1.AbstractContextMenuService)
], EditorActionRegistryImpl.prototype, "menuService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.ILogger),
    tslib_1.__metadata("design:type", Object)
], EditorActionRegistryImpl.prototype, "logger", void 0);
EditorActionRegistryImpl = tslib_1.__decorate([
    (0, di_1.Injectable)()
], EditorActionRegistryImpl);
exports.EditorActionRegistryImpl = EditorActionRegistryImpl;
//# sourceMappingURL=editor.menu.js.map