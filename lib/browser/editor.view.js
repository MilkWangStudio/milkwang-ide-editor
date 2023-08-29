"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentWrapper = exports.ComponentsWrapper = exports.EditorGroupBody = exports.EditorGroupView = exports.EditorGridView = exports.EditorView = void 0;
const tslib_1 = require("tslib");
const classnames_1 = tslib_1.__importDefault(require("classnames"));
const mobx_react_lite_1 = require("mobx-react-lite");
const react_1 = tslib_1.__importDefault(require("react"));
const react_dom_1 = tslib_1.__importDefault(require("react-dom"));
const react_is_1 = tslib_1.__importDefault(require("react-is"));
const ide_components_1 = require("@opensumi/ide-components");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const components_1 = require("@opensumi/ide-core-browser/lib/components");
const view_id_1 = require("@opensumi/ide-core-browser/lib/layout/view-id");
const react_hooks_1 = require("@opensumi/ide-core-browser/lib/react-hooks");
const common_1 = require("../common");
const editor_module_less_1 = tslib_1.__importDefault(require("./editor.module.less"));
const grid_service_1 = require("./grid/grid.service");
const navigation_view_1 = require("./navigation.view");
const tab_view_1 = require("./tab.view");
const types_1 = require("./types");
const EditorView = () => {
    const ref = react_1.default.useRef();
    const workbenchEditorService = (0, react_hooks_1.useInjectable)(common_1.WorkbenchEditorService);
    const componentRegistry = (0, react_hooks_1.useInjectable)(ide_core_browser_1.ComponentRegistry);
    const rightWidgetInfo = componentRegistry.getComponentRegistryInfo('editor-widget-right');
    const RightWidget = rightWidgetInfo && rightWidgetInfo.views[0].component;
    const [ready, setReady] = react_1.default.useState(workbenchEditorService.gridReady);
    react_1.default.useEffect(() => {
        if (!ready) {
            if (workbenchEditorService.gridReady) {
                setReady(true);
            }
            else {
                const disposer = workbenchEditorService.onDidGridReady(() => {
                    setReady(true);
                });
                return () => disposer.dispose();
            }
        }
    }, []);
    if (!ready) {
        return null;
    }
    return (react_1.default.createElement("div", { className: editor_module_less_1.default.kt_workbench_editor, id: 'workbench-editor', ref: (ele) => {
            ref.current = ele;
            if (ele) {
                workbenchEditorService.onDomCreated(ele);
            }
        } },
        react_1.default.createElement("div", { className: editor_module_less_1.default.kt_editor_main_wrapper },
            react_1.default.createElement(exports.EditorGridView, { grid: workbenchEditorService.topGrid })),
        RightWidget ? (react_1.default.createElement("div", { className: editor_module_less_1.default.kt_editor_right_widget },
            react_1.default.createElement(ide_core_browser_1.ErrorBoundary, null,
                react_1.default.createElement(RightWidget, null)))) : null));
};
exports.EditorView = EditorView;
const cachedGroupView = {};
const EditorGridView = ({ grid }) => {
    let editorGroupContainer;
    const context = react_1.default.useContext(ide_core_browser_1.ConfigContext);
    const eventBus = (0, react_hooks_1.useInjectable)(ide_core_browser_1.IEventBus);
    const resizeDelegates = [];
    const [, updateState] = react_1.default.useState();
    const forceUpdate = react_1.default.useCallback(() => updateState({}), []);
    react_1.default.useEffect(() => {
        if (editorGroupContainer) {
            if (cachedGroupView[grid.editorGroup.name]) {
                editorGroupContainer.appendChild(cachedGroupView[grid.editorGroup.name]);
                grid.editorGroup.layoutEditors();
            }
            else {
                const div = document.createElement('div');
                cachedGroupView[grid.editorGroup.name] = div;
                div.style.height = '100%';
                editorGroupContainer.appendChild(div);
                react_dom_1.default.render(react_1.default.createElement(ide_core_browser_1.ConfigProvider, { value: context },
                    react_1.default.createElement(exports.EditorGroupView, { group: grid.editorGroup })), div);
            }
        }
    });
    (0, ide_core_browser_1.useDisposable)(() => [
        eventBus.on(types_1.EditorGroupsResetSizeEvent, () => {
            if (grid.splitDirection && resizeDelegates.length > 0) {
                resizeDelegates.forEach((delegate) => {
                    delegate.setSize(1 / grid.children.length, 1 / grid.children.length);
                });
            }
        }),
        grid.onDidGridStateChange(() => {
            forceUpdate();
        }),
    ], []);
    if (grid.children.length === 0 && grid.editorGroup) {
        return react_1.default.createElement("div", { style: { height: '100%' }, ref: (el) => el && (editorGroupContainer = el) });
    }
    const defaultChildStyle = grid.splitDirection === grid_service_1.SplitDirection.Horizontal
        ? { width: 100 / grid.children.length + '%' }
        : { height: 100 / grid.children.length + '%' };
    const children = [];
    grid.children.forEach((g, index) => {
        if (index !== 0) {
            if (grid.splitDirection === grid_service_1.SplitDirection.Vertical) {
                children.push(react_1.default.createElement(components_1.ResizeHandleVertical, { key: 'resize-' + grid.children[index - 1].uid + '-' + g.uid, onResize: () => {
                        grid.children[index - 1].emitResizeWithEventBus(eventBus);
                        g.emitResizeWithEventBus(eventBus);
                    }, delegate: (delegate) => {
                        resizeDelegates.push(delegate);
                    }, flexMode: components_1.ResizeFlexMode.Percentage }));
            }
            else {
                children.push(react_1.default.createElement(components_1.ResizeHandleHorizontal, { key: 'resize-' + grid.children[index - 1].uid + '-' + g.uid, onResize: () => {
                        grid.children[index - 1].emitResizeWithEventBus(eventBus);
                        g.emitResizeWithEventBus(eventBus);
                    }, delegate: (delegate) => {
                        resizeDelegates.push(delegate);
                    } }));
            }
        }
        children.push(react_1.default.createElement("div", { className: (0, classnames_1.default)({
                [editor_module_less_1.default.kt_grid_vertical_child]: grid.splitDirection === grid_service_1.SplitDirection.Vertical,
                [editor_module_less_1.default.kt_grid_horizontal_child]: grid.splitDirection === grid_service_1.SplitDirection.Horizontal,
            }), style: defaultChildStyle, key: g.uid, "data-min-resize": grid.splitDirection === grid_service_1.SplitDirection.Horizontal ? 150 : 60 },
            react_1.default.createElement(exports.EditorGridView, { grid: g })));
    });
    return (react_1.default.createElement("div", { className: (0, classnames_1.default)({
            [editor_module_less_1.default.kt_grid_vertical]: grid.splitDirection === grid_service_1.SplitDirection.Vertical,
            [editor_module_less_1.default.kt_grid_horizontal]: grid.splitDirection === grid_service_1.SplitDirection.Horizontal,
        }) }, children));
};
exports.EditorGridView = EditorGridView;
const cachedEditor = {};
/**
 * 默认的 editor empty component
 * 接受外部的 editorBackgroundImage 作为图片展示
 */
const EditorEmptyComponent = ({ editorBackgroundImage }) => {
    if (!editorBackgroundImage) {
        return null;
    }
    return (react_1.default.createElement("div", { className: editor_module_less_1.default.editorEmpty },
        react_1.default.createElement("img", { className: editor_module_less_1.default.editorEmptyImg, src: editorBackgroundImage })));
};
exports.EditorGroupView = (0, mobx_react_lite_1.observer)(({ group }) => {
    const groupWrapperRef = react_1.default.useRef();
    const preferenceService = (0, react_hooks_1.useInjectable)(ide_core_browser_1.PreferenceService);
    const [isEmpty, setIsEmpty] = react_1.default.useState(group.resources.length === 0);
    const appConfig = (0, react_hooks_1.useInjectable)(ide_core_browser_1.AppConfig);
    const { editorBackgroundImage } = appConfig;
    react_1.default.useEffect(() => {
        group.attachToDom(groupWrapperRef.current);
    });
    react_1.default.useEffect(() => {
        // 由于当前可能已经发生改变，因此需要再检查一次
        setIsEmpty(group.resources.length === 0);
        const disposer = group.onDidEditorGroupTabChanged(() => {
            setIsEmpty(group.resources.length === 0);
        });
        return () => {
            disposer.dispose();
        };
    }, []);
    const [showActionWhenGroupEmpty, setShowActionWhenGroupEmpty] = react_1.default.useState(() => !!preferenceService.get('editor.showActionWhenGroupEmpty'));
    (0, ide_core_browser_1.useDisposable)(() => [
        preferenceService.onPreferenceChanged((change) => {
            if (change.preferenceName === 'editor.showActionWhenGroupEmpty') {
                setShowActionWhenGroupEmpty(!!change.newValue);
            }
        }),
    ], []);
    const componentRegistry = (0, react_hooks_1.useInjectable)(ide_core_browser_1.ComponentRegistry);
    // TODO: 将图片转换成默认的 editor component
    const EmptyEditorViewConfig = react_1.default.useMemo(() => {
        const emptyComponentInfo = componentRegistry.getComponentRegistryInfo('editor-empty');
        return ((emptyComponentInfo && emptyComponentInfo.views[0]) ||
            {
                component: EditorEmptyComponent,
                initialProps: { editorBackgroundImage },
            });
    }, []);
    return (react_1.default.createElement("div", { ref: groupWrapperRef, className: editor_module_less_1.default.kt_editor_group, tabIndex: 1, onFocus: (e) => {
            group.gainFocus();
        } },
        (!isEmpty || showActionWhenGroupEmpty) && (react_1.default.createElement("div", { className: editor_module_less_1.default.editorGroupHeader },
            react_1.default.createElement(tab_view_1.Tabs, { group: group }))),
        react_1.default.createElement(exports.EditorGroupBody, { group: group }),
        isEmpty && (react_1.default.createElement("div", { className: editor_module_less_1.default.kt_editor_background, style: {
                backgroundImage: !EmptyEditorViewConfig && editorBackgroundImage ? `url(${editorBackgroundImage})` : 'none',
            } }, EmptyEditorViewConfig && react_is_1.default.isValidElementType(EmptyEditorViewConfig.component) ? (react_1.default.createElement(ide_core_browser_1.ErrorBoundary, null, react_1.default.createElement(EmptyEditorViewConfig.component, EmptyEditorViewConfig.initialProps))) : null))));
});
exports.EditorGroupBody = (0, mobx_react_lite_1.observer)(({ group }) => {
    const editorBodyRef = react_1.default.useRef(null);
    const editorService = (0, react_hooks_1.useInjectable)(common_1.WorkbenchEditorService);
    const eventBus = (0, react_hooks_1.useInjectable)(ide_core_browser_1.IEventBus);
    const components = [];
    const codeEditorRef = react_1.default.useRef(null);
    const diffEditorRef = react_1.default.useRef(null);
    const mergeEditorRef = react_1.default.useRef(null);
    const [, updateState] = react_1.default.useState();
    const forceUpdate = react_1.default.useCallback(() => updateState({}), []);
    react_1.default.useEffect(() => {
        if (codeEditorRef.current) {
            if (cachedEditor[group.name]) {
                cachedEditor[group.name].remove();
                codeEditorRef.current.appendChild(cachedEditor[group.name]);
            }
            else {
                const container = document.createElement('div');
                codeEditorRef.current.appendChild(container);
                cachedEditor[group.name] = container;
                group.createEditor(container);
            }
        }
        if (diffEditorRef.current) {
            group.attachDiffEditorDom(diffEditorRef.current);
        }
        if (mergeEditorRef.current) {
            group.attachMergeEditorDom(mergeEditorRef.current);
        }
    }, [codeEditorRef.current, diffEditorRef.current, mergeEditorRef.current]);
    (0, ide_core_browser_1.useDisposable)(() => group.onDidEditorGroupBodyChanged(() => {
        forceUpdate();
    }), []);
    group.activeComponents.forEach((resources, component) => {
        const initialProps = group.activateComponentsProps.get(component);
        components.push(react_1.default.createElement("div", { key: component.uid, className: (0, classnames_1.default)({
                [editor_module_less_1.default.kt_hidden]: !(group.currentOpenType && group.currentOpenType.componentId === component.uid),
            }) },
            react_1.default.createElement(exports.ComponentsWrapper, Object.assign({ key: component.uid, component: component }, initialProps, { resources: resources, current: group.currentResource }))));
    });
    const editorHasNoTab = react_1.default.useMemo(() => group.resources.length === 0 || !group.currentResource, [group.resources.length, group.currentResource]);
    react_1.default.useEffect(() => {
        var _a, _b;
        if (((_a = group.currentOpenType) === null || _a === void 0 ? void 0 : _a.type) === types_1.EditorOpenType.code) {
            eventBus.fire(new types_1.CodeEditorDidVisibleEvent({
                groupName: group.name,
                type: types_1.EditorOpenType.code,
                editorId: group.codeEditor.getId(),
            }));
        }
        else if (((_b = group.currentOpenType) === null || _b === void 0 ? void 0 : _b.type) === types_1.EditorOpenType.diff) {
            eventBus.fire(new types_1.CodeEditorDidVisibleEvent({
                groupName: group.name,
                type: types_1.EditorOpenType.diff,
                editorId: group.diffEditor.modifiedEditor.getId(),
            }));
        }
    });
    return (react_1.default.createElement("div", { id: view_id_1.VIEW_CONTAINERS.EDITOR, ref: editorBodyRef, className: editor_module_less_1.default.kt_editor_body, onDragOver: (e) => {
            e.preventDefault();
            if (editorBodyRef.current) {
                const position = getDragOverPosition(e.nativeEvent, editorBodyRef.current);
                decorateDragOverElement(editorBodyRef.current, position);
            }
        }, onDragLeave: (e) => {
            if (editorBodyRef.current) {
                removeDecorationDragOverElement(editorBodyRef.current);
            }
        }, onDrop: (e) => {
            if (editorBodyRef.current) {
                removeDecorationDragOverElement(editorBodyRef.current);
                if (e.dataTransfer.getData('uri')) {
                    const uri = new ide_core_browser_1.URI(e.dataTransfer.getData('uri'));
                    let sourceGroup;
                    if (e.dataTransfer.getData('uri-source-group')) {
                        sourceGroup = editorService.getEditorGroup(e.dataTransfer.getData('uri-source-group'));
                    }
                    group.dropUri(uri, getDragOverPosition(e.nativeEvent, editorBodyRef.current), sourceGroup);
                }
                if (e.dataTransfer.files.length > 0) {
                    eventBus.fire(new types_1.EditorGroupFileDropEvent({
                        group,
                        files: e.dataTransfer.files,
                        position: getDragOverPosition(e.nativeEvent, editorBodyRef.current),
                    }));
                }
            }
        } },
        !editorHasNoTab && react_1.default.createElement(navigation_view_1.NavigationBar, { editorGroup: group }),
        group.currentResource && react_1.default.createElement(EditorSideView, { side: 'top', resource: group.currentResource }),
        react_1.default.createElement("div", { className: editor_module_less_1.default.kt_editor_components },
            react_1.default.createElement("div", { className: (0, classnames_1.default)({
                    [editor_module_less_1.default.kt_editor_component]: true,
                    [editor_module_less_1.default.kt_hidden]: !group.currentOpenType || group.currentOpenType.type !== types_1.EditorOpenType.component,
                }) }, components),
            react_1.default.createElement("div", { className: (0, classnames_1.default)({
                    [editor_module_less_1.default.kt_editor_code_editor]: true,
                    [editor_module_less_1.default.kt_editor_component]: true,
                    [editor_module_less_1.default.kt_hidden]: !group.currentOpenType || group.currentOpenType.type !== types_1.EditorOpenType.code,
                }), ref: codeEditorRef }),
            react_1.default.createElement("div", { className: (0, classnames_1.default)(editor_module_less_1.default.kt_editor_diff_editor, editor_module_less_1.default.kt_editor_component, {
                    [editor_module_less_1.default.kt_hidden]: !group.currentOpenType || group.currentOpenType.type !== types_1.EditorOpenType.diff,
                }), ref: diffEditorRef }),
            react_1.default.createElement("div", { className: (0, classnames_1.default)(editor_module_less_1.default.kt_editor_diff_3_editor, editor_module_less_1.default.kt_editor_component, {
                    [editor_module_less_1.default.kt_hidden]: !group.currentOpenType || group.currentOpenType.type !== types_1.EditorOpenType.mergeEditor,
                }), ref: mergeEditorRef })),
        group.currentResource && react_1.default.createElement(EditorSideView, { side: 'bottom', resource: group.currentResource })));
});
const ComponentsWrapper = (_a) => {
    var { component, resources, current } = _a, other = tslib_1.__rest(_a, ["component", "resources", "current"]);
    return (react_1.default.createElement("div", { className: editor_module_less_1.default.kt_editor_component_wrapper }, resources.map((resource) => (react_1.default.createElement(exports.ComponentWrapper, Object.assign({}, other, { key: resource.toString(), component: component, resource: resource, hidden: !(current && current.uri.toString() === resource.uri.toString()) }))))));
};
exports.ComponentsWrapper = ComponentsWrapper;
const ComponentWrapper = (_a) => {
    var { component, resource, hidden } = _a, other = tslib_1.__rest(_a, ["component", "resource", "hidden"]);
    const componentService = (0, react_hooks_1.useInjectable)(types_1.EditorComponentRegistry);
    let containerRef = null;
    let componentNode;
    if (component.renderMode !== types_1.EditorComponentRenderMode.ONE_PER_WORKBENCH) {
        componentNode = react_1.default.createElement(component.component, Object.assign({ resource: resource }, other));
    }
    const context = react_1.default.useContext(ide_core_browser_1.ConfigContext);
    react_1.default.useEffect(() => {
        if (component.renderMode === types_1.EditorComponentRenderMode.ONE_PER_WORKBENCH) {
            if (!componentService.perWorkbenchComponents[component.uid]) {
                const div = document.createElement('div');
                div.style.height = '100%';
                componentService.perWorkbenchComponents[component.uid] = div;
                // 对于per_workbench的，resource默认为不会改变
                react_dom_1.default.render(react_1.default.createElement(ide_core_browser_1.ConfigProvider, { value: context },
                    react_1.default.createElement(component.component, { resource: resource })), div);
            }
            containerRef.appendChild(componentService.perWorkbenchComponents[component.uid]);
        }
    });
    return (react_1.default.createElement("div", { key: resource.uri.toString(), className: (0, classnames_1.default)({
            [editor_module_less_1.default.kt_hidden]: hidden,
        }) },
        react_1.default.createElement(ide_components_1.Scrollbars, null,
            react_1.default.createElement(ide_core_browser_1.ErrorBoundary, null,
                react_1.default.createElement("div", { ref: (el) => {
                        containerRef = el;
                    }, style: { height: '100%' } }, componentNode)))));
};
exports.ComponentWrapper = ComponentWrapper;
function getDragOverPosition(e, element) {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    if (x < width * 0.15) {
        return types_1.DragOverPosition.LEFT;
    }
    if (x > width * 0.85) {
        return types_1.DragOverPosition.RIGHT;
    }
    if (y < height * 0.15) {
        return types_1.DragOverPosition.TOP;
    }
    if (y > height * 0.85) {
        return types_1.DragOverPosition.BOTTOM;
    }
    return types_1.DragOverPosition.CENTER;
}
function addClass(element, className) {
    if (!element.classList.contains(className)) {
        element.classList.add(className);
    }
}
function removeClass(element, className) {
    if (element.classList.contains(className)) {
        element.classList.remove(className);
    }
}
function decorateDragOverElement(element, position) {
    addClass(element, editor_module_less_1.default.kt_on_drag_over);
    [types_1.DragOverPosition.LEFT, types_1.DragOverPosition.RIGHT, types_1.DragOverPosition.TOP, types_1.DragOverPosition.BOTTOM]
        .filter((pos) => pos !== position)
        .forEach((pos) => {
        removeClass(element, editor_module_less_1.default['kt_on_drag_over_' + pos]);
    });
    addClass(element, editor_module_less_1.default['kt_on_drag_over_' + position]);
}
function removeDecorationDragOverElement(element) {
    removeClass(element, editor_module_less_1.default.kt_on_drag_over);
    [types_1.DragOverPosition.LEFT, types_1.DragOverPosition.RIGHT, types_1.DragOverPosition.TOP, types_1.DragOverPosition.BOTTOM].forEach((pos) => {
        removeClass(element, editor_module_less_1.default['kt_on_drag_over_' + pos]);
    });
}
const EditorSideView = ({ side, resource }) => {
    const componentRegistry = (0, react_hooks_1.useInjectable)(types_1.EditorComponentRegistry);
    const eventBus = (0, react_hooks_1.useInjectable)(ide_core_browser_1.IEventBus);
    const widgets = componentRegistry.getSideWidgets(side, resource);
    const [, updateState] = react_1.default.useState();
    const forceUpdate = react_1.default.useCallback(() => updateState({}), []);
    (0, ide_core_browser_1.useDisposable)(() => eventBus.on(types_1.RegisterEditorSideComponentEvent, forceUpdate), []);
    return (react_1.default.createElement("div", { className: (0, classnames_1.default)(editor_module_less_1.default['kt_editor_side_widgets'], editor_module_less_1.default['kt_editor_side_widgets_' + side]) }, widgets.map((widget) => {
        const C = widget.component;
        return react_1.default.createElement(C, Object.assign({ resource: resource, key: widget.id }, (widget.initialProps || {})));
    })));
};
//# sourceMappingURL=editor.view.js.map