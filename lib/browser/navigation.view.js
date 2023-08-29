"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavigationMenuModel = exports.NavigationBarViewService = exports.NavigationMenuContainer = exports.NavigationMenu = exports.NavigationItem = exports.NavigationBar = void 0;
const tslib_1 = require("tslib");
const classnames_1 = tslib_1.__importDefault(require("classnames"));
const mobx_1 = require("mobx");
const mobx_react_lite_1 = require("mobx-react-lite");
const react_1 = tslib_1.__importStar(require("react"));
const di_1 = require("@opensumi/di");
const ide_components_1 = require("@opensumi/ide-components");
const ide_components_2 = require("@opensumi/ide-components");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const ide_core_browser_2 = require("@opensumi/ide-core-browser");
const breadcrumbs_menus_1 = require("./menu/breadcrumbs.menus");
const navigation_module_less_1 = tslib_1.__importDefault(require("./navigation.module.less"));
const types_1 = require("./types");
const react_hook_1 = require("./view/react-hook");
const workbench_editor_service_1 = require("./workbench-editor.service");
const NavigationBar = ({ editorGroup }) => {
    const breadCrumbService = (0, ide_core_browser_1.useInjectable)(types_1.IBreadCrumbService);
    (0, react_hook_1.useUpdateOnGroupTabChange)(editorGroup);
    (0, ide_core_browser_1.useUpdateOnEvent)(breadCrumbService.onDidUpdateBreadCrumbResults, [], (e) => {
        var _a;
        const editor = editorGroup.currentEditor && editorGroup.currentEditor.currentDocumentModel ? editorGroup.currentEditor : null;
        const uri = editorGroup.currentEditor && editorGroup.currentEditor.currentDocumentModel
            ? editorGroup.currentEditor.currentDocumentModel.uri
            : (_a = editorGroup.currentResource) === null || _a === void 0 ? void 0 : _a.uri;
        return !!uri && e.editor === editor && e.uri.isEqual(uri);
    });
    if (editorGroup.resources.length === 0 || !editorGroup.currentResource) {
        return null;
    }
    let parts;
    if (editorGroup.currentEditor && editorGroup.currentEditor.currentDocumentModel) {
        parts = breadCrumbService.getBreadCrumbs(editorGroup.currentEditor.currentDocumentModel.uri, editorGroup.currentEditor);
    }
    else {
        parts = breadCrumbService.getBreadCrumbs(editorGroup.currentResource.uri, null);
    }
    if (!parts) {
        return null;
    }
    return parts.length === 0 ? null : (react_1.default.createElement("div", { className: navigation_module_less_1.default.navigation_container, onContextMenu: (event) => {
            event.preventDefault();
        } }, parts.map((p, i) => (react_1.default.createElement(react_1.default.Fragment, { key: i + '-crumb:' + p.name },
        i > 0 && react_1.default.createElement(ide_components_1.Icon, { icon: 'right', size: 'small', className: navigation_module_less_1.default.navigation_icon }),
        react_1.default.createElement(exports.NavigationItem, { part: p, editorGroup: editorGroup }))))));
};
exports.NavigationBar = NavigationBar;
exports.NavigationItem = (0, react_1.memo)(({ part, editorGroup }) => {
    const viewService = (0, ide_core_browser_1.useInjectable)(NavigationBarViewService);
    const breadcrumbsMenuService = (0, ide_core_browser_1.useInjectable)(breadcrumbs_menus_1.BreadCrumbsMenuService);
    const itemRef = (0, react_1.useRef)();
    const onClick = (0, react_1.useCallback)(async () => {
        if (part.getSiblings && itemRef.current) {
            const { left, top, height } = itemRef.current.getBoundingClientRect();
            const siblings = await part.getSiblings();
            let leftPos = left;
            if (window.innerWidth - leftPos < 200 + 10) {
                // 放左边
                leftPos = window.innerWidth - 200 - 5;
            }
            viewService.showMenu(siblings.parts, leftPos, top + height + 5, siblings.currentIndex, part.uri, editorGroup);
        }
    }, [itemRef.current, part]);
    return (react_1.default.createElement("span", { onClick: onClick, onContextMenu: (event) => {
            if (!part.isSymbol && part.uri) {
                breadcrumbsMenuService.show(event.nativeEvent.x, event.nativeEvent.y, editorGroup, part.uri);
            }
            event.preventDefault();
        }, className: navigation_module_less_1.default['navigation-part'], ref: itemRef },
        part.icon && react_1.default.createElement("span", { className: part.icon }),
        react_1.default.createElement("span", null, part.name)));
});
exports.NavigationMenu = (0, mobx_react_lite_1.observer)(({ model }) => {
    let maxHeight = window.innerHeight - model.y - 20;
    let top = model.y;
    const height = model.parts.length * 22;
    if (maxHeight < 100 && maxHeight < height) {
        maxHeight = 100;
        top = window.innerHeight - 20 - maxHeight;
    }
    const scrollerContainer = (0, react_1.useRef)();
    const viewService = (0, ide_core_browser_1.useInjectable)(NavigationBarViewService);
    const scrollToCurrent = (0, react_1.useCallback)(() => {
        if (scrollerContainer.current) {
            try {
                const current = scrollerContainer.current.querySelector(`.${navigation_module_less_1.default.navigation_menu_item_current}`);
                if (current) {
                    current.scrollIntoView({ behavior: 'auto', block: 'center' });
                }
            }
            catch (e) {
                // noop
            }
        }
    }, [scrollerContainer.current]);
    return (react_1.default.createElement("div", { className: navigation_module_less_1.default.navigation_menu, style: {
            left: model.x + 'px',
            top: top + 'px',
            maxHeight: maxHeight + 'px',
            height: height + 'px',
        } },
        react_1.default.createElement(ide_components_2.Scrollbars, { className: navigation_module_less_1.default.navigation_menu_items, universal: true, forwardedRef: (el) => {
                scrollerContainer.current = el;
                scrollToCurrent();
            } }, model.parts.map((p, i) => {
            let itemRef;
            const clickToGetChild = p.getChildren
                ? async () => {
                    if (itemRef) {
                        const { left, top, width } = itemRef.getBoundingClientRect();
                        let nextLeft = left + width + 5;
                        if (window.innerWidth - nextLeft < 200 + 10) {
                            // 放左边
                            nextLeft = left - width - 5;
                        }
                        model.showSubMenu(await p.getChildren(), nextLeft, top, model);
                    }
                }
                : undefined;
            const clickToNavigate = p.onClick
                ? () => {
                    p.onClick();
                    viewService.dispose();
                }
                : undefined;
            return (react_1.default.createElement("div", { onClick: clickToNavigate || clickToGetChild, ref: (el) => (itemRef = el), className: (0, classnames_1.default)(navigation_module_less_1.default.navigation_menu_item, {
                    [navigation_module_less_1.default.navigation_menu_item_current]: i === model.initialIndex,
                }), key: 'menu-' + p.name },
                react_1.default.createElement("span", { className: p.icon || (0, ide_core_browser_2.getIcon)('smile') }),
                react_1.default.createElement("span", { className: navigation_module_less_1.default.navigation_menu_item_label }, p.name),
                p.getChildren && (react_1.default.createElement("span", { className: navigation_module_less_1.default.navigation_right, onClick: 
                    // 如果两个都存在，点右侧按钮为展开，点击名称为导航至
                    clickToNavigate && clickToGetChild
                        ? (e) => {
                            e.stopPropagation();
                            clickToGetChild();
                        }
                        : undefined },
                    react_1.default.createElement(ide_components_1.Icon, { icon: 'right', size: 'small' })))));
        })),
        model.subMenu && react_1.default.createElement(exports.NavigationMenu, { model: model.subMenu })));
});
exports.NavigationMenuContainer = (0, mobx_react_lite_1.observer)(() => {
    const viewService = (0, ide_core_browser_1.useInjectable)(NavigationBarViewService);
    const menuRef = (0, react_1.useRef)();
    (0, react_1.useEffect)(() => {
        if (menuRef.current) {
            const disposer = new ide_core_browser_1.Disposable();
            disposer.addDispose(new ide_core_browser_1.DomListener(window, 'mouseup', () => {
                viewService.dispose();
            }));
            disposer.addDispose(new ide_core_browser_1.DomListener(menuRef.current, 'mouseup', (event) => {
                event.stopPropagation();
            }));
            return disposer.dispose.bind(disposer);
        }
    });
    if (!viewService.current) {
        return null;
    }
    else {
        return (react_1.default.createElement("div", { tabIndex: 1, ref: menuRef },
            react_1.default.createElement(exports.NavigationMenu, { model: viewService.current })));
    }
});
let NavigationBarViewService = class NavigationBarViewService {
    showMenu(parts, x, y, currentIndex, uri, editorGroup) {
        this.current = new NavigationMenuModel(parts, x, y, currentIndex, uri);
        this.editorGroup = editorGroup;
    }
    dispose() {
        if (this.current) {
            this.current.dispose();
        }
        this.current = undefined;
    }
};
tslib_1.__decorate([
    mobx_1.observable.ref,
    tslib_1.__metadata("design:type", Object)
], NavigationBarViewService.prototype, "current", void 0);
tslib_1.__decorate([
    mobx_1.observable.ref,
    tslib_1.__metadata("design:type", workbench_editor_service_1.EditorGroup)
], NavigationBarViewService.prototype, "editorGroup", void 0);
NavigationBarViewService = tslib_1.__decorate([
    (0, di_1.Injectable)()
], NavigationBarViewService);
exports.NavigationBarViewService = NavigationBarViewService;
class NavigationMenuModel {
    constructor(parts, x, y, initialIndex = -1, uri) {
        this.parts = parts;
        this.x = x;
        this.y = y;
        this.initialIndex = initialIndex;
        this.uri = uri;
    }
    showSubMenu(parts, x, y, uri) {
        this.subMenu = new NavigationMenuModel(parts, x, y, -1, uri);
    }
    dispose() {
        if (this.subMenu) {
            this.subMenu.dispose();
        }
        this.subMenu = undefined;
    }
}
tslib_1.__decorate([
    mobx_1.observable.ref,
    tslib_1.__metadata("design:type", NavigationMenuModel)
], NavigationMenuModel.prototype, "subMenu", void 0);
exports.NavigationMenuModel = NavigationMenuModel;
//# sourceMappingURL=navigation.view.js.map