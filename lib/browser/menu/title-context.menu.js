"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabTitleMenuService = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const resource_1 = require("@opensumi/ide-core-browser/lib/contextkey/resource");
const next_1 = require("@opensumi/ide-core-browser/lib/menu/next");
let TabTitleMenuService = class TabTitleMenuService {
    get editorTitleContextKey() {
        if (!this._editorTitleContextKey) {
            this._editorTitleContextKey = this.contextKeyService.createKey('editorTitleContext', false);
        }
        return this._editorTitleContextKey;
    }
    show(x, y, uri, group) {
        // 设置resourceScheme
        const titleContext = group.contextKeyService.createScoped();
        const resourceContext = new resource_1.ResourceContextKey(titleContext);
        resourceContext.set(uri);
        this.editorTitleContextKey.set(true);
        const menus = this.ctxMenuService.createMenu({
            id: next_1.MenuId.EditorTitleContext,
            contextKeyService: titleContext,
        });
        const menuNodes = menus.getMergedMenuNodes();
        menus.dispose();
        titleContext.dispose();
        this.ctxMenuRenderer.show({
            anchor: { x, y },
            menuNodes,
            args: [{ uri, group }],
            onHide: () => {
                this.editorTitleContextKey.set(false);
            },
        });
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(next_1.AbstractContextMenuService),
    tslib_1.__metadata("design:type", next_1.AbstractContextMenuService)
], TabTitleMenuService.prototype, "ctxMenuService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(next_1.ICtxMenuRenderer),
    tslib_1.__metadata("design:type", next_1.ICtxMenuRenderer)
], TabTitleMenuService.prototype, "ctxMenuRenderer", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.IContextKeyService),
    tslib_1.__metadata("design:type", Object)
], TabTitleMenuService.prototype, "contextKeyService", void 0);
TabTitleMenuService = tslib_1.__decorate([
    (0, di_1.Injectable)()
], TabTitleMenuService);
exports.TabTitleMenuService = TabTitleMenuService;
//# sourceMappingURL=title-context.menu.js.map