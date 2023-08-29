"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BreadCrumbsMenuService = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const next_1 = require("@opensumi/ide-core-browser/lib/menu/next");
let BreadCrumbsMenuService = class BreadCrumbsMenuService {
    show(x, y, group, uri) {
        const titleContext = group.contextKeyService;
        const menus = this.ctxMenuService.createMenu({
            id: next_1.MenuId.BreadcrumbsTitleContext,
            contextKeyService: titleContext,
        });
        const menuNodes = menus.getMergedMenuNodes();
        this.ctxMenuRenderer.show({
            anchor: { x, y },
            menuNodes,
            args: [{ uri, group }],
        });
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(next_1.AbstractContextMenuService),
    tslib_1.__metadata("design:type", next_1.AbstractContextMenuService)
], BreadCrumbsMenuService.prototype, "ctxMenuService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(next_1.ICtxMenuRenderer),
    tslib_1.__metadata("design:type", next_1.ICtxMenuRenderer)
], BreadCrumbsMenuService.prototype, "ctxMenuRenderer", void 0);
BreadCrumbsMenuService = tslib_1.__decorate([
    (0, di_1.Injectable)()
], BreadCrumbsMenuService);
exports.BreadCrumbsMenuService = BreadCrumbsMenuService;
//# sourceMappingURL=breadcrumbs.menus.js.map