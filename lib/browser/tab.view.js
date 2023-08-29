"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorActions = exports.Tabs = void 0;
const tslib_1 = require("tslib");
const classnames_1 = tslib_1.__importDefault(require("classnames"));
const react_1 = tslib_1.__importStar(require("react"));
const ide_components_1 = require("@opensumi/ide-components");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const actions_1 = require("@opensumi/ide-core-browser/lib/components/actions");
const constants_1 = require("@opensumi/ide-core-browser/lib/layout/constants");
const view_id_1 = require("@opensumi/ide-core-browser/lib/layout/view-id");
const next_1 = require("@opensumi/ide-core-browser/lib/menu/next");
const react_hooks_1 = require("@opensumi/ide-core-browser/lib/react-hooks");
const common_1 = require("../common");
const editor_module_less_1 = tslib_1.__importDefault(require("./editor.module.less"));
const title_context_menu_1 = require("./menu/title-context.menu");
const types_1 = require("./types");
const react_hook_1 = require("./view/react-hook");
const pkgName = require('../../package.json').name;
const Tabs = ({ group }) => {
    const tabContainer = (0, react_1.useRef)();
    const tabWrapperRef = (0, react_1.useRef)();
    const contentRef = (0, react_1.useRef)();
    const editorActionUpdateTimer = (0, react_1.useRef)(null);
    const editorActionRef = (0, react_1.useRef)(null);
    const resourceService = (0, react_hooks_1.useInjectable)(common_1.ResourceService);
    const eventBus = (0, react_hooks_1.useInjectable)(ide_core_browser_1.IEventBus);
    const configContext = (0, react_1.useContext)(ide_core_browser_1.ConfigContext);
    const editorService = (0, react_hooks_1.useInjectable)(common_1.WorkbenchEditorService);
    const tabTitleMenuService = (0, react_hooks_1.useInjectable)(title_context_menu_1.TabTitleMenuService);
    const preferenceService = (0, react_hooks_1.useInjectable)(ide_core_browser_1.PreferenceService);
    const menuRegistry = (0, react_hooks_1.useInjectable)(next_1.IMenuRegistry);
    const [tabsLoadingMap, setTabsLoadingMap] = (0, react_1.useState)({});
    const [wrapMode, setWrapMode] = (0, react_1.useState)(!!preferenceService.get('editor.wrapTab'));
    const [tabMap, setTabMap] = (0, react_1.useState)(new Map());
    const [lastMarginRight, setLastMarginRight] = (0, react_1.useState)();
    const slotLocation = (0, react_1.useMemo)(() => (0, ide_core_browser_1.getSlotLocation)(pkgName, configContext.layoutConfig), []);
    (0, react_hook_1.useUpdateOnGroupTabChange)(group);
    (0, react_hooks_1.useUpdateOnEventBusEvent)(common_1.ResourceDidUpdateEvent, [group.resources], (uri) => !!contentRef && group.resources.findIndex((r) => r.uri.isEqual(uri)) !== -1);
    (0, react_1.useEffect)(() => {
        const disposer = new ide_core_browser_1.Disposable();
        disposer.addDispose(group.onDidEditorGroupContentLoading((resource) => {
            var _a;
            (_a = group.resourceStatus.get(resource)) === null || _a === void 0 ? void 0 : _a.finally(() => {
                setTabsLoadingMap(Object.assign({}, tabsLoadingMap, {
                    [resource.uri.toString()]: false,
                }));
            });
            setTabsLoadingMap(Object.assign({}, tabsLoadingMap, {
                [resource.uri.toString()]: true,
            }));
        }));
        disposer.addDispose(group.onDidEditorGroupTabChanged(() => {
            if (!wrapMode) {
                scrollToCurrent();
            }
        }));
        return () => {
            disposer.dispose();
        };
    }, [group]);
    const onDrop = (0, react_1.useCallback)((e, index, target) => {
        if (e.dataTransfer.getData('uri')) {
            const uri = new ide_core_browser_1.URI(e.dataTransfer.getData('uri'));
            let sourceGroup;
            if (e.dataTransfer.getData('uri-source-group')) {
                sourceGroup = editorService.getEditorGroup(e.dataTransfer.getData('uri-source-group'));
            }
            group.dropUri(uri, types_1.DragOverPosition.CENTER, sourceGroup, target);
        }
        if (e.dataTransfer.files.length > 0) {
            eventBus.fire(new types_1.EditorGroupFileDropEvent({
                group,
                tabIndex: index,
                files: e.dataTransfer.files,
            }));
        }
    }, [group]);
    const scrollToCurrent = (0, react_1.useCallback)(() => {
        if (tabContainer.current) {
            if (group.currentResource) {
                try {
                    const currentTab = tabContainer.current.querySelector('.' + editor_module_less_1.default.kt_editor_tab + "[data-uri='" + group.currentResource.uri.toString() + "']");
                    if (currentTab) {
                        currentTab.scrollIntoView();
                    }
                }
                catch (e) {
                    // noop
                }
            }
        }
    }, [group, tabContainer.current]);
    const updateTabMarginRight = (0, react_1.useCallback)(() => {
        if (editorActionUpdateTimer.current) {
            clearTimeout(editorActionUpdateTimer.current);
            editorActionUpdateTimer.current = null;
        }
        const timer = setTimeout(() => {
            var _a, _b;
            if (((_a = editorActionRef.current) === null || _a === void 0 ? void 0 : _a.offsetWidth) !== lastMarginRight) {
                setLastMarginRight((_b = editorActionRef.current) === null || _b === void 0 ? void 0 : _b.offsetWidth);
            }
        }, 200);
        editorActionUpdateTimer.current = timer;
    }, [editorActionRef.current, editorActionUpdateTimer.current, lastMarginRight]);
    (0, react_1.useEffect)(() => {
        if (!wrapMode) {
            queueMicrotask(() => {
                scrollToCurrent();
            });
        }
    }, [wrapMode, tabContainer.current]);
    (0, react_1.useEffect)(() => {
        if (!wrapMode) {
            const disposer = new ide_core_browser_1.Disposable();
            if (tabContainer.current) {
                disposer.addDispose(new ide_core_browser_1.DomListener(tabContainer.current, 'mousewheel', preventNavigation));
            }
            disposer.addDispose(eventBus.on(ide_core_browser_1.ResizeEvent, (event) => {
                if (event.payload.slotLocation === slotLocation) {
                    scrollToCurrent();
                }
            }));
            disposer.addDispose(eventBus.on(types_1.GridResizeEvent, (event) => {
                if (event.payload.gridId === group.grid.uid) {
                    scrollToCurrent();
                }
            }));
            return () => {
                disposer.dispose();
            };
        }
    }, [wrapMode]);
    const layoutLastInRow = (0, react_1.useCallback)(() => {
        if (contentRef.current && wrapMode) {
            const newMap = new Map();
            let currentTabY;
            let lastTab;
            const tabs = Array.from(contentRef.current.children);
            // 最后一个元素是editorAction
            tabs.pop();
            tabs.forEach((child) => {
                if (child.offsetTop !== currentTabY) {
                    currentTabY = child.offsetTop;
                    if (lastTab) {
                        newMap.set(tabs.indexOf(lastTab), true);
                    }
                }
                lastTab = child;
                newMap.set(tabs.indexOf(child), false);
            });
            // 最后一个 tab 不做 grow 处理
            setTabMap(newMap);
        }
    }, [contentRef.current, wrapMode]);
    (0, react_1.useEffect)(() => {
        updateTabMarginRight();
    }, [editorActionRef.current, wrapMode]);
    (0, react_1.useEffect)(layoutLastInRow, [wrapMode, contentRef.current, group, group.resources.length]);
    (0, react_1.useEffect)(() => {
        const disposable = new ide_core_browser_1.DisposableCollection();
        disposable.push(eventBus.on(ide_core_browser_1.ResizeEvent, (e) => {
            if (e.payload.slotLocation === slotLocation) {
                layoutLastInRow();
            }
        }));
        disposable.push(preferenceService.onPreferenceChanged((e) => {
            if (e.preferenceName === 'editor.wrapTab') {
                setWrapMode(!!e.newValue);
            }
        }));
        // 当前选中的group变化时宽度变化
        disposable.push(editorService.onDidCurrentEditorGroupChanged(() => {
            window.requestAnimationFrame(updateTabMarginRight);
        }));
        // editorMenu变化时宽度可能变化
        disposable.push(ide_core_browser_1.Event.debounce(ide_core_browser_1.Event.filter(menuRegistry.onDidChangeMenu, (menuId) => menuId === next_1.MenuId.EditorTitle), () => { }, 200)(() => {
            window.requestAnimationFrame(updateTabMarginRight);
        }));
        return () => {
            disposable.dispose();
        };
    }, []);
    (0, react_1.useEffect)(() => {
        const disposableCollection = new ide_core_browser_1.DisposableCollection();
        disposableCollection.push(group.onDidEditorFocusChange((event) => {
            updateTabMarginRight();
        }));
        return () => {
            disposableCollection.dispose();
        };
    }, [group]);
    const handleWrapperDragOver = (0, react_1.useCallback)((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (tabWrapperRef.current) {
            tabWrapperRef.current.classList.add(editor_module_less_1.default.kt_on_drag_over);
        }
    }, [tabWrapperRef.current]);
    const handleWrapperDragLeave = (0, react_1.useCallback)((e) => {
        if (tabWrapperRef.current) {
            tabWrapperRef.current.classList.remove(editor_module_less_1.default.kt_on_drag_over);
        }
    }, [tabWrapperRef.current]);
    const handleWrapperDrag = (0, react_1.useCallback)((e) => {
        if (tabWrapperRef.current) {
            tabWrapperRef.current.classList.remove(editor_module_less_1.default.kt_on_drag_over);
        }
        if (onDrop) {
            onDrop(e, -1);
        }
    }, [onDrop, tabWrapperRef.current]);
    const handleEmptyDBClick = (0, react_1.useCallback)((e) => {
        if (e.target === e.currentTarget) {
            editorService.createUntitledResource();
        }
    }, [editorService]);
    const renderTabContent = () => (react_1.default.createElement("div", { className: editor_module_less_1.default.kt_editor_tabs_content, ref: contentRef },
        group.resources.map((resource, i) => {
            let ref;
            const decoration = resourceService.getResourceDecoration(resource.uri);
            const subname = resourceService.getResourceSubname(resource, group.resources);
            return (react_1.default.createElement("div", { draggable: true, title: resource.title, className: (0, classnames_1.default)({
                    [editor_module_less_1.default.kt_editor_tab]: true,
                    [editor_module_less_1.default.last_in_row]: tabMap.get(i),
                    [editor_module_less_1.default.kt_editor_tab_current]: group.currentResource === resource,
                    [editor_module_less_1.default.kt_editor_tab_preview]: group.previewURI && group.previewURI.isEqual(resource.uri),
                }), style: wrapMode && i === group.resources.length - 1
                    ? { marginRight: lastMarginRight, height: constants_1.LAYOUT_VIEW_SIZE.EDITOR_TABS_HEIGHT }
                    : {
                        height: group.currentResource === resource
                            ? constants_1.LAYOUT_VIEW_SIZE.EDITOR_TABS_HEIGHT + 1
                            : constants_1.LAYOUT_VIEW_SIZE.EDITOR_TABS_HEIGHT,
                    }, onContextMenu: (event) => {
                    tabTitleMenuService.show(event.nativeEvent.x, event.nativeEvent.y, resource && resource.uri, group);
                    event.preventDefault();
                }, key: resource.uri.toString(), onMouseUp: (e) => {
                    if (e.nativeEvent.which === 2) {
                        e.preventDefault();
                        e.stopPropagation();
                        group.close(resource.uri);
                    }
                }, onMouseDown: (e) => {
                    if (e.nativeEvent.which === 1) {
                        group.open(resource.uri, { focus: true });
                    }
                }, "data-uri": resource.uri.toString(), onDragOver: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (ref) {
                        ref.classList.add(editor_module_less_1.default.kt_on_drag_over);
                    }
                }, onDragLeave: (e) => {
                    if (ref) {
                        ref.classList.remove(editor_module_less_1.default.kt_on_drag_over);
                    }
                }, onDrop: (e) => {
                    if (ref) {
                        ref.classList.remove(editor_module_less_1.default.kt_on_drag_over);
                    }
                    if (onDrop) {
                        onDrop(e, i, resource);
                    }
                }, onDoubleClick: (e) => {
                    group.pinPreviewed(resource.uri);
                }, ref: (el) => (ref = el), onDragStart: (e) => {
                    e.dataTransfer.setData('uri', resource.uri.toString());
                    e.dataTransfer.setData('uri-source-group', group.name);
                } },
                react_1.default.createElement("div", { className: tabsLoadingMap[resource.uri.toString()] ? 'loading_indicator' : (0, classnames_1.default)(resource.icon) }, ' '),
                react_1.default.createElement("div", null, resource.name),
                subname ? react_1.default.createElement("div", { className: editor_module_less_1.default.subname }, subname) : null,
                decoration.readOnly ? (react_1.default.createElement("span", { className: (0, classnames_1.default)((0, ide_core_browser_1.getExternalIcon)('lock'), editor_module_less_1.default.editor_readonly_icon) })) : null,
                react_1.default.createElement("div", { className: editor_module_less_1.default.tab_right },
                    react_1.default.createElement("div", { className: (0, classnames_1.default)({
                            [editor_module_less_1.default.kt_hidden]: !decoration.dirty,
                            [editor_module_less_1.default.dirty]: true,
                        }) }),
                    react_1.default.createElement("div", { className: editor_module_less_1.default.close_tab, onMouseDown: (e) => {
                            e.stopPropagation();
                            group.close(resource.uri);
                        } },
                        react_1.default.createElement("div", { className: (0, classnames_1.default)((0, ide_core_browser_1.getIcon)('close'), editor_module_less_1.default.kt_editor_close_icon) })))));
        }),
        wrapMode && react_1.default.createElement(exports.EditorActions, { className: editor_module_less_1.default.kt_editor_wrap_mode_action, ref: editorActionRef, group: group })));
    return (react_1.default.createElement("div", { id: view_id_1.VIEW_CONTAINERS.EDITOR_TABS, className: editor_module_less_1.default.kt_editor_tabs },
        react_1.default.createElement("div", { className: editor_module_less_1.default.kt_editor_tabs_scroll_wrapper, ref: tabWrapperRef, onDragOver: handleWrapperDragOver, onDragLeave: handleWrapperDragLeave, onDrop: handleWrapperDrag, onDoubleClick: handleEmptyDBClick }, !wrapMode ? (react_1.default.createElement(ide_components_1.Scrollbars, { tabBarMode: true, forwardedRef: (el) => (el ? (tabContainer.current = el) : null), className: editor_module_less_1.default.kt_editor_tabs_scroll }, renderTabContent())) : (react_1.default.createElement("div", { className: editor_module_less_1.default.kt_editor_wrap_container }, renderTabContent()))),
        !wrapMode && react_1.default.createElement(exports.EditorActions, { ref: editorActionRef, group: group })));
};
exports.Tabs = Tabs;
exports.EditorActions = (0, react_1.forwardRef)((props, ref) => {
    const { group, className } = props;
    const acquireArgs = (0, react_1.useCallback)(() => {
        var _a, _b;
        return (group.currentResource
            ? [
                group.currentResource.uri,
                group,
                ((_a = group.currentOrPreviousFocusedEditor) === null || _a === void 0 ? void 0 : _a.currentUri) || ((_b = group.currentEditor) === null || _b === void 0 ? void 0 : _b.currentUri),
            ]
            : undefined);
    }, [group]);
    const editorActionRegistry = (0, react_hooks_1.useInjectable)(types_1.IEditorActionRegistry);
    const editorService = (0, react_hooks_1.useInjectable)(common_1.WorkbenchEditorService);
    const menu = editorActionRegistry.getMenu(group);
    const [hasFocus, setHasFocus] = (0, react_1.useState)(editorService.currentEditorGroup === group);
    const [args, setArgs] = (0, react_1.useState)(acquireArgs());
    (0, react_1.useEffect)(() => {
        const disposableCollection = new ide_core_browser_1.DisposableCollection();
        disposableCollection.push(editorService.onDidCurrentEditorGroupChanged(() => {
            setHasFocus(editorService.currentEditorGroup === group);
        }));
        disposableCollection.push(editorService.onActiveResourceChange(() => {
            setArgs(acquireArgs());
        }));
        disposableCollection.push(group.onDidEditorGroupTabChanged(() => {
            setArgs(acquireArgs());
        }));
        return () => {
            disposableCollection.dispose();
        };
    }, [group]);
    // 第三个参数是当前编辑器的URI（如果有）
    return (react_1.default.createElement("div", { ref: ref, className: (0, classnames_1.default)(editor_module_less_1.default.editor_actions, className), style: { height: constants_1.LAYOUT_VIEW_SIZE.EDITOR_TABS_HEIGHT } },
        react_1.default.createElement(actions_1.InlineMenuBar, { menus: menu, context: args, 
            // 不 focus 的时候只展示 more 菜单
            regroup: (nav, more) => (hasFocus ? [nav, more] : [[], more]) })));
});
function preventNavigation(e) {
    if (this.offsetWidth + this.scrollLeft + e.deltaX > this.scrollWidth) {
        e.preventDefault();
    }
    else if (this.scrollLeft + e.deltaX < 0) {
        e.preventDefault();
    }
}
//# sourceMappingURL=tab.view.js.map