"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeEditorDidVisibleEvent = exports.EditorComponentDisposeEvent = exports.ResourceOpenTypeChangedEvent = exports.IEditorFeatureRegistry = exports.IBreadCrumbService = exports.CompareResult = exports.ICompareService = exports.IEditorActionRegistry = exports.EditorDecorationTypeRemovedEvent = exports.EditorDecorationChangeEvent = exports.EditorDecorationProviderRegistrationEvent = exports.RegisterEditorSideComponentEvent = exports.EditorGroupsResetSizeEvent = exports.EditorGroupIndexChangedEvent = exports.EditorConfigurationChangedEvent = exports.EditorVisibleChangeEvent = exports.EditorSelectionChangeEvent = exports.IEditorDecorationCollectionService = exports.EditorGroupFileDropEvent = exports.EditorActiveResourceStateChangedEvent = exports.EditorGroupChangeEvent = exports.EditorGroupDisposeEvent = exports.EditorGroupCloseEvent = exports.EditorGroupOpenEvent = exports.GridResizeEvent = exports.BrowserEditorContribution = exports.EditorComponentRegistry = exports.RegisterEditorComponentEvent = exports.RegisterEditorComponentResolverEvent = exports.EditorComponentRenderMode = void 0;
const tslib_1 = require("tslib");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
tslib_1.__exportStar(require("../common"), exports);
/**
 * 默认值: ONE_PER_GROUP
 * ONE_PER_RESOURCE  - 每个资源只初始化一次组件
 * ONE_PER_GROUP     - 每个资源在同个 Group 下只初始化一次组件
 * ONE_PER_WORKBENCH - 整个渲染过程复用同一个组件，即组件仅会初始化一次
 */
var EditorComponentRenderMode;
(function (EditorComponentRenderMode) {
    EditorComponentRenderMode[EditorComponentRenderMode["ONE_PER_RESOURCE"] = 1] = "ONE_PER_RESOURCE";
    EditorComponentRenderMode[EditorComponentRenderMode["ONE_PER_GROUP"] = 2] = "ONE_PER_GROUP";
    EditorComponentRenderMode[EditorComponentRenderMode["ONE_PER_WORKBENCH"] = 3] = "ONE_PER_WORKBENCH";
})(EditorComponentRenderMode = exports.EditorComponentRenderMode || (exports.EditorComponentRenderMode = {}));
/**
 * 注册编辑器组件 Resolver 时触发
 */
class RegisterEditorComponentResolverEvent extends ide_core_browser_1.BasicEvent {
}
exports.RegisterEditorComponentResolverEvent = RegisterEditorComponentResolverEvent;
/**
 * 注册编辑器组件时触发
 */
class RegisterEditorComponentEvent extends ide_core_browser_1.BasicEvent {
}
exports.RegisterEditorComponentEvent = RegisterEditorComponentEvent;
class EditorComponentRegistry {
}
exports.EditorComponentRegistry = EditorComponentRegistry;
exports.BrowserEditorContribution = Symbol('BrowserEditorContribution');
class GridResizeEvent extends ide_core_browser_1.BasicEvent {
}
exports.GridResizeEvent = GridResizeEvent;
class EditorGroupOpenEvent extends ide_core_browser_1.BasicEvent {
}
exports.EditorGroupOpenEvent = EditorGroupOpenEvent;
class EditorGroupCloseEvent extends ide_core_browser_1.BasicEvent {
}
exports.EditorGroupCloseEvent = EditorGroupCloseEvent;
class EditorGroupDisposeEvent extends ide_core_browser_1.BasicEvent {
}
exports.EditorGroupDisposeEvent = EditorGroupDisposeEvent;
class EditorGroupChangeEvent extends ide_core_browser_1.BasicEvent {
}
exports.EditorGroupChangeEvent = EditorGroupChangeEvent;
class EditorActiveResourceStateChangedEvent extends ide_core_browser_1.BasicEvent {
}
exports.EditorActiveResourceStateChangedEvent = EditorActiveResourceStateChangedEvent;
class EditorGroupFileDropEvent extends ide_core_browser_1.BasicEvent {
}
exports.EditorGroupFileDropEvent = EditorGroupFileDropEvent;
exports.IEditorDecorationCollectionService = Symbol('IEditorDecorationCollectionService');
class EditorSelectionChangeEvent extends ide_core_browser_1.BasicEvent {
}
exports.EditorSelectionChangeEvent = EditorSelectionChangeEvent;
class EditorVisibleChangeEvent extends ide_core_browser_1.BasicEvent {
}
exports.EditorVisibleChangeEvent = EditorVisibleChangeEvent;
class EditorConfigurationChangedEvent extends ide_core_browser_1.BasicEvent {
}
exports.EditorConfigurationChangedEvent = EditorConfigurationChangedEvent;
class EditorGroupIndexChangedEvent extends ide_core_browser_1.BasicEvent {
}
exports.EditorGroupIndexChangedEvent = EditorGroupIndexChangedEvent;
class EditorGroupsResetSizeEvent extends ide_core_browser_1.BasicEvent {
}
exports.EditorGroupsResetSizeEvent = EditorGroupsResetSizeEvent;
class RegisterEditorSideComponentEvent extends ide_core_browser_1.BasicEvent {
}
exports.RegisterEditorSideComponentEvent = RegisterEditorSideComponentEvent;
class EditorDecorationProviderRegistrationEvent extends ide_core_browser_1.BasicEvent {
}
exports.EditorDecorationProviderRegistrationEvent = EditorDecorationProviderRegistrationEvent;
class EditorDecorationChangeEvent extends ide_core_browser_1.BasicEvent {
}
exports.EditorDecorationChangeEvent = EditorDecorationChangeEvent;
class EditorDecorationTypeRemovedEvent extends ide_core_browser_1.BasicEvent {
}
exports.EditorDecorationTypeRemovedEvent = EditorDecorationTypeRemovedEvent;
exports.IEditorActionRegistry = Symbol('IEditorActionRegistry');
exports.ICompareService = Symbol('ICompareService');
var CompareResult;
(function (CompareResult) {
    CompareResult["revert"] = "revert";
    CompareResult["accept"] = "accept";
    CompareResult["cancel"] = "cancel";
})(CompareResult = exports.CompareResult || (exports.CompareResult = {}));
exports.IBreadCrumbService = Symbol('IBreadScrumbService');
exports.IEditorFeatureRegistry = Symbol('IEditorFeatureRegistry');
class ResourceOpenTypeChangedEvent extends ide_core_browser_1.BasicEvent {
}
exports.ResourceOpenTypeChangedEvent = ResourceOpenTypeChangedEvent;
class EditorComponentDisposeEvent extends ide_core_browser_1.BasicEvent {
}
exports.EditorComponentDisposeEvent = EditorComponentDisposeEvent;
class CodeEditorDidVisibleEvent extends ide_core_browser_1.BasicEvent {
}
exports.CodeEditorDidVisibleEvent = CodeEditorDidVisibleEvent;
//# sourceMappingURL=types.js.map