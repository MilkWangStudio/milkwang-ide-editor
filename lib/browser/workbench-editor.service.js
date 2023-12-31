"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorGroup = exports.WorkbenchEditorServiceImpl = void 0;
const tslib_1 = require("tslib");
const mobx_1 = require("mobx");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const resource_1 = require("@opensumi/ide-core-browser/lib/contextkey/resource");
const merge_editor_widget_1 = require("@opensumi/ide-core-browser/lib/monaco/merge-editor-widget");
const ide_core_common_1 = require("@opensumi/ide-core-common");
const ide_core_common_2 = require("@opensumi/ide-core-common");
const ide_overlay_1 = require("@opensumi/ide-overlay");
const monaco = tslib_1.__importStar(require("@opensumi/monaco-editor-core/esm/vs/editor/editor.api"));
const common_1 = require("../common");
const types_1 = require("./doc-model/types");
const error_1 = require("./error");
const grid_service_1 = require("./grid/grid.service");
const types_2 = require("./types");
const untitled_resource_1 = require("./untitled-resource");
const MAX_CONFIRM_RESOURCES = 10;
const couldRevive = (r) => !!(r.supportsRevive && !r.deleted);
let WorkbenchEditorServiceImpl = class WorkbenchEditorServiceImpl extends ide_core_common_2.WithEventBus {
    constructor() {
        super();
        this.editorGroups = [];
        this._onDidEditorGroupsChanged = new ide_core_common_2.Emitter();
        this.onDidEditorGroupsChanged = this._onDidEditorGroupsChanged.event;
        this._sortedEditorGroups = [];
        this._onActiveResourceChange = new ide_core_common_2.Emitter();
        this.onActiveResourceChange = this._onActiveResourceChange.event;
        this._onActiveEditorUriChange = new ide_core_common_2.Emitter();
        this.onActiveEditorUriChange = this._onActiveEditorUriChange.event;
        this._onCursorChange = new ide_core_common_2.Emitter();
        this.onCursorChange = this._onCursorChange.event;
        this._onDidCurrentEditorGroupChanged = new ide_core_common_2.Emitter();
        this.onDidCurrentEditorGroupChanged = this._onDidCurrentEditorGroupChanged.event;
        this._restoring = true;
        this.contributionsReady = new ide_core_common_2.Deferred();
        this.untitledCloseIndex = [];
        this.gridReady = false;
        this._onDidGridReady = new ide_core_common_2.Emitter();
        this.onDidGridReady = this._onDidGridReady.event;
        this.initialize();
    }
    setEditorContextKeyService(contextKeyService) {
        this.editorContextKeyService = contextKeyService;
    }
    setCurrentGroup(editorGroup) {
        var _a;
        if (editorGroup) {
            if (this._currentEditorGroup === editorGroup) {
                return;
            }
            this._currentEditorGroup = editorGroup;
            this._onActiveResourceChange.fire(editorGroup.currentResource);
            this.eventBus.fire(new types_2.EditorActiveResourceStateChangedEvent({
                resource: editorGroup.currentResource,
                openType: editorGroup.currentOpenType,
                editorUri: (_a = this.currentEditor) === null || _a === void 0 ? void 0 : _a.currentUri,
            }));
            this._onDidCurrentEditorGroupChanged.fire(this._currentEditorGroup);
        }
    }
    onEditorGroupChangeEvent(e) {
        var _a;
        if (e.payload.group === this.currentEditorGroup) {
            this.eventBus.fire(new types_2.EditorActiveResourceStateChangedEvent({
                resource: e.payload.newResource,
                openType: e.payload.newOpenType,
                editorUri: (_a = this.currentEditor) === null || _a === void 0 ? void 0 : _a.currentUri,
            }));
        }
    }
    getAllOpenedUris() {
        const uris = [];
        for (const group of this.editorGroups) {
            for (const resource of group.resources) {
                const index = uris.findIndex((u) => u.isEqual(resource.uri));
                if (index === -1) {
                    uris.push(resource.uri);
                }
            }
        }
        return uris;
    }
    async saveAll(includeUntitled, reason) {
        for (const editorGroup of this.editorGroups) {
            await editorGroup.saveAll(includeUntitled, reason);
        }
    }
    hasDirty() {
        for (const editorGroup of this.editorGroups) {
            if (editorGroup.hasDirty()) {
                return true;
            }
        }
        return false;
    }
    calcDirtyCount() {
        const countedUris = new Set();
        return this.editorGroups.reduce((pre, cur) => pre + cur.calcDirtyCount(countedUris), 0);
    }
    createEditorGroup() {
        const editorGroup = this.injector.get(EditorGroup, [this.generateRandomEditorGroupName()]);
        this.editorGroups.push(editorGroup);
        const currentWatchDisposer = new ide_core_common_2.Disposable(editorGroup.onDidEditorGroupBodyChanged(() => {
            if (editorGroup === this.currentEditorGroup) {
                if (!editorGroup.currentOpenType && editorGroup.currentResource) {
                    // 暂时状态，不发事件
                }
                else {
                    this._onActiveResourceChange.fire(editorGroup.currentResource);
                }
            }
        }), editorGroup.onDidEditorFocusChange(() => {
            var _a;
            if (editorGroup === this.currentEditorGroup) {
                if (!editorGroup.currentOpenType && editorGroup.currentResource) {
                    // 暂时状态，不发事件
                }
                else {
                    this._onActiveEditorUriChange.fire((_a = editorGroup.currentOrPreviousFocusedEditor) === null || _a === void 0 ? void 0 : _a.currentUri);
                }
            }
        }));
        editorGroup.addDispose({
            dispose: () => {
                currentWatchDisposer.dispose();
            },
        });
        const groupChangeDisposer = editorGroup.onDidEditorGroupTabChanged(() => {
            this.saveOpenedResourceState();
        });
        editorGroup.addDispose({
            dispose: () => {
                groupChangeDisposer.dispose();
            },
        });
        editorGroup.onCurrentEditorCursorChange((e) => {
            if (this._currentEditorGroup === editorGroup) {
                this._onCursorChange.fire(e);
            }
        });
        return editorGroup;
    }
    /**
     * 随机生成一个不重复的editor Group
     */
    generateRandomEditorGroupName() {
        let name = (0, ide_core_common_2.makeRandomHexString)(5);
        while (this.editorGroups.findIndex((g) => g.name === name) !== -1) {
            name = (0, ide_core_common_2.makeRandomHexString)(5);
        }
        return name;
    }
    initialize() {
        if (!this.initializing) {
            this.initializing = this.doInitialize();
        }
        return this.initializing;
    }
    async doInitialize() {
        this.openedResourceState = await this.initializeState();
        await this.contributionsReady.promise;
        await this.restoreState();
        this._currentEditorGroup = this.editorGroups[0];
    }
    async initializeState() {
        const state = await this.getStorage(ide_core_common_2.STORAGE_NAMESPACE.WORKBENCH);
        return state;
    }
    get currentEditor() {
        return this.currentEditorGroup && this.currentEditorGroup.currentEditor;
    }
    get currentCodeEditor() {
        return this.currentEditorGroup.currentCodeEditor;
    }
    get currentEditorGroup() {
        return this._currentEditorGroup;
    }
    get currentOrPreviousFocusedEditor() {
        return this.currentEditorGroup && this.currentEditorGroup.currentOrPreviousFocusedEditor;
    }
    async open(uri, options) {
        await this.initialize();
        let group = this.currentEditorGroup;
        let groupIndex;
        if (options && typeof options.groupIndex !== 'undefined') {
            groupIndex = options.groupIndex;
        }
        else if (options && options.relativeGroupIndex) {
            groupIndex = this.currentEditorGroup.index + options.relativeGroupIndex;
        }
        if (typeof groupIndex === 'number' && groupIndex >= 0) {
            if (groupIndex >= this.editorGroups.length) {
                return group.open(uri, Object.assign({}, options, { split: common_1.EditorGroupSplitAction.Right }));
            }
            else {
                group = this.sortedEditorGroups[groupIndex] || this.currentEditorGroup;
            }
        }
        return group.open(uri, options);
    }
    async openUris(uris) {
        await this.initialize();
        await this.currentEditorGroup.openUris(uris);
        return;
    }
    getEditorGroup(name) {
        return this.editorGroups.find((g) => g.name === name);
    }
    get currentResource() {
        if (!this.currentEditorGroup) {
            return null;
        }
        return this.currentEditorGroup.currentResource;
    }
    removeGroup(group) {
        const index = this.editorGroups.findIndex((e) => e === group);
        if (index !== -1) {
            if (this.editorGroups.length === 1) {
                return;
            }
            this.editorGroups.splice(index, 1);
            if (this.currentEditorGroup === group) {
                this.setCurrentGroup(this.editorGroups[0]);
            }
            for (let i = index; i < this.editorGroups.length; i++) {
                this.eventBus.fire(new types_2.EditorGroupIndexChangedEvent({
                    group: this.editorGroups[i],
                    index: i,
                }));
            }
        }
    }
    async saveOpenedResourceState() {
        if (this._restoring) {
            return;
        }
        const state = this.topGrid.serialize();
        await this.openedResourceState.set('grid', state);
    }
    prepareContextKeyService() {
        // contextKeys
        const getLanguageFromModel = (uri) => {
            let result = null;
            const modelRef = this.documentModelManager.getModelReference(uri, 'resourceContextKey');
            if (modelRef) {
                result = modelRef.instance.languageId;
                modelRef.dispose();
            }
            return result;
        };
        const resourceContext = new resource_1.ResourceContextKey(this.editorContextKeyService, (uri) => {
            const res = getLanguageFromModel(uri);
            if (res) {
                return res;
            }
            else {
                return getLanguageFromModel(uri);
            }
        });
        this.onActiveResourceChange((resource) => {
            if (this.currentEditor && this.currentEditor.currentUri) {
                resourceContext.set(this.currentEditor.currentUri);
            }
            else {
                if (resource) {
                    resourceContext.set(resource.uri);
                }
                else {
                    resourceContext.reset();
                }
            }
        });
        if (this.currentEditor && this.currentEditor.currentUri) {
            resourceContext.set(this.currentEditor.currentUri);
        }
        else {
            if (this.currentResource) {
                resourceContext.set(this.currentResource.uri);
            }
            else {
                resourceContext.reset();
            }
        }
    }
    onDomCreated(domNode) {
        this._domNode = domNode;
        if (this.editorContextKeyService) {
            this.editorContextKeyService.attachToDomNode(domNode);
        }
    }
    notifyGroupChanged() {
        this._sortedEditorGroups = undefined;
        this._onDidEditorGroupsChanged.fire();
    }
    async restoreState() {
        let state = { editorGroup: { uris: [], previewIndex: -1 } };
        state = this.openedResourceState.get('grid', state);
        this.topGrid = new grid_service_1.EditorGrid();
        this.topGrid.onDidGridAndDesendantStateChange(() => {
            this._sortedEditorGroups = undefined;
            this._onDidEditorGroupsChanged.fire();
        });
        const editorRestorePromises = [];
        const promise = this.topGrid
            .deserialize(state, () => this.createEditorGroup(), editorRestorePromises)
            .then(() => {
            if (this.topGrid.children.length === 0 && !this.topGrid.editorGroup) {
                this.topGrid.setEditorGroup(this.createEditorGroup());
            }
            this.gridReady = true;
            this._onDidGridReady.fire();
            this.notifyGroupChanged();
        });
        Promise.all(editorRestorePromises).then(() => {
            this._restoring = false;
            for (const contribution of this.contributions.getContributions()) {
                if (contribution.onDidRestoreState) {
                    contribution.onDidRestoreState();
                }
            }
        });
        return promise;
    }
    async closeAll(uri, force) {
        for (const group of this.editorGroups.slice(0)) {
            if (uri) {
                await group.close(uri, { force });
            }
            else {
                await group.closeAll();
            }
        }
    }
    /**
     * Return true in order to prevent exit.
     */
    async closeAllOnlyConfirmOnce() {
        const resources = [];
        for (const group of this.editorGroups) {
            for (const resource of group.resources) {
                resources.push(resource);
            }
        }
        const shouldClose = await Promise.all(resources.map(async (resource) => ({
            shouldClose: await this.resourceService.shouldCloseResourceWithoutConfirm(resource),
            resource,
        })));
        const toClose = shouldClose.filter((v) => v.shouldClose);
        if (toClose.length === 0) {
            return false;
        }
        // 询问用户是否保存
        const buttons = {
            [(0, ide_core_common_1.localize)('file.prompt.dontSave', "Don't Save")]: types_2.AskSaveResult.REVERT,
            [(0, ide_core_common_1.localize)('file.prompt.save', 'Save')]: types_2.AskSaveResult.SAVE,
            [(0, ide_core_common_1.localize)('file.prompt.cancel', 'Cancel')]: types_2.AskSaveResult.CANCEL,
        };
        const files = toClose.slice(0, MAX_CONFIRM_RESOURCES);
        let filesDetail = files.map((v) => v.resource.name).join('、');
        if (toClose.length > MAX_CONFIRM_RESOURCES) {
            if (toClose.length - MAX_CONFIRM_RESOURCES === 1) {
                filesDetail += (0, ide_core_common_1.localize)('file.prompt.more.one');
            }
            else {
                filesDetail += (0, ide_core_common_2.formatLocalize)('file.prompt.more.number', toClose.length - MAX_CONFIRM_RESOURCES);
            }
        }
        const selection = await this.dialogService.open((0, ide_core_browser_1.toMarkdown)((0, ide_core_common_2.formatLocalize)('saveNFilesChangesMessage', toClose.length, filesDetail), this.openner), ide_core_common_1.MessageType.Info, Object.keys(buttons));
        const result = buttons[selection];
        if (result === types_2.AskSaveResult.SAVE) {
            await Promise.all(toClose.map((v) => { var _a, _b; return (_b = (_a = this.resourceService).close) === null || _b === void 0 ? void 0 : _b.call(_a, v.resource, types_2.AskSaveResult.SAVE); }));
            return false;
        }
        else if (result === types_2.AskSaveResult.REVERT) {
            await Promise.all(toClose.map((v) => { var _a, _b; return (_b = (_a = this.resourceService).close) === null || _b === void 0 ? void 0 : _b.call(_a, v.resource, types_2.AskSaveResult.REVERT); }));
            return false;
        }
        return true;
    }
    async close(uri, force) {
        return this.closeAll(uri, force);
    }
    get sortedEditorGroups() {
        if (!this._sortedEditorGroups) {
            this._sortedEditorGroups = [];
            this.topGrid.sortEditorGroups(this._sortedEditorGroups);
        }
        return this._sortedEditorGroups;
    }
    handleOnCloseUntitledResource(e) {
        if (e.payload.resource.uri.scheme === ide_core_common_1.Schemes.untitled) {
            const { index } = e.payload.resource.uri.getParsedQuery();
            this.untitledCloseIndex.push(parseInt(index, 10));
            // 升序排序，每次可以去到最小的 index
            this.untitledCloseIndex.sort((a, b) => a - b);
        }
    }
    createUntitledURI() {
        // 优先从已删除的 index 中获取
        const index = this.untitledCloseIndex.shift() || this.untitledIndex.id;
        return new ide_core_common_2.URI().withScheme(ide_core_common_1.Schemes.untitled).withQuery(`name=Untitled-${index}&index=${index}`);
    }
    createUntitledResource(options = {
        uri: this.createUntitledURI(),
    }) {
        return this.open(options.uri, Object.assign({ preview: false, focus: true }, options.resourceOpenOptions));
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(di_1.INJECTOR_TOKEN),
    tslib_1.__metadata("design:type", di_1.Injector)
], WorkbenchEditorServiceImpl.prototype, "injector", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(common_1.ResourceService),
    tslib_1.__metadata("design:type", common_1.ResourceService)
], WorkbenchEditorServiceImpl.prototype, "resourceService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_common_2.StorageProvider),
    tslib_1.__metadata("design:type", Function)
], WorkbenchEditorServiceImpl.prototype, "getStorage", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_overlay_1.IDialogService),
    tslib_1.__metadata("design:type", Object)
], WorkbenchEditorServiceImpl.prototype, "dialogService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.IOpenerService),
    tslib_1.__metadata("design:type", Object)
], WorkbenchEditorServiceImpl.prototype, "openner", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(types_2.BrowserEditorContribution),
    tslib_1.__metadata("design:type", Object)
], WorkbenchEditorServiceImpl.prototype, "contributions", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(types_1.IEditorDocumentModelService),
    tslib_1.__metadata("design:type", Object)
], WorkbenchEditorServiceImpl.prototype, "documentModelManager", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(),
    tslib_1.__metadata("design:type", untitled_resource_1.UntitledDocumentIdCounter)
], WorkbenchEditorServiceImpl.prototype, "untitledIndex", void 0);
tslib_1.__decorate([
    (0, ide_core_common_2.OnEvent)(types_2.EditorGroupChangeEvent),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [types_2.EditorGroupChangeEvent]),
    tslib_1.__metadata("design:returntype", void 0)
], WorkbenchEditorServiceImpl.prototype, "onEditorGroupChangeEvent", null);
tslib_1.__decorate([
    (0, ide_core_common_2.OnEvent)(types_2.EditorGroupCloseEvent),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [types_2.EditorGroupCloseEvent]),
    tslib_1.__metadata("design:returntype", void 0)
], WorkbenchEditorServiceImpl.prototype, "handleOnCloseUntitledResource", null);
WorkbenchEditorServiceImpl = tslib_1.__decorate([
    (0, di_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [])
], WorkbenchEditorServiceImpl);
exports.WorkbenchEditorServiceImpl = WorkbenchEditorServiceImpl;
/**
 * Editor Group是一个可视的编辑区域
 * 它由tab，editor，diff-editor，富组件container组成
 */
let EditorGroup = class EditorGroup extends ide_core_common_2.WithEventBus {
    constructor(name) {
        super();
        this.name = name;
        this.openingPromise = new Map();
        this._onDidEditorFocusChange = this.registerDispose(new ide_core_common_2.Emitter());
        this.onDidEditorFocusChange = this._onDidEditorFocusChange.event;
        /**
         * 当编辑器的tab部分发生变更
         */
        this._onDidEditorGroupTabChanged = new ide_core_common_2.Emitter();
        this.onDidEditorGroupTabChanged = this._onDidEditorGroupTabChanged.event;
        /**
         * 当编辑器的主体部分发生变更
         */
        this._onDidEditorGroupBodyChanged = new ide_core_common_2.Emitter();
        this.onDidEditorGroupBodyChanged = this._onDidEditorGroupBodyChanged.event;
        /**
         * 当编辑器有内容处于加载状态
         */
        this._onDidEditorGroupContentLoading = new ide_core_common_2.Emitter();
        this.onDidEditorGroupContentLoading = this._onDidEditorGroupContentLoading.event;
        /**
         * 每个group只能有一个preview
         */
        this.previewURI = null;
        /**
         * 当前打开的所有resource
         */
        // @observable.shallow
        this.resources = [];
        this.resourceStatus = new Map();
        /**
         * 当前resource的打开方式
         */
        this.cachedResourcesActiveOpenTypes = new Map();
        this.cachedResourcesOpenTypes = new Map();
        this.availableOpenTypes = [];
        this.activeComponents = new Map();
        this.activateComponentsProps = new Map();
        this.holdDocumentModelRefs = new Map();
        this.toDispose = [];
        this._prevDomHeight = 0;
        this._prevDomWidth = 0;
        this._codeEditorPendingLayout = false;
        this._diffEditorPendingLayout = false;
        this._mergeEditorPendingLayout = false;
        // 当前为EditorComponent，且monaco光标变化时触发
        this._onCurrentEditorCursorChange = new ide_core_common_2.Emitter();
        this.onCurrentEditorCursorChange = this._onCurrentEditorCursorChange.event;
        this.resourceOpenHistory = [];
        this._domNode = null;
        this._diffEditorDomNode = null;
        this._diffEditorDomNodeAttached = false;
        this._mergeEditorDomNode = null;
        this._mergeEditorDomNodeAttached = false;
        this.codeEditorReady = new ide_core_common_2.ReadyEvent();
        this.diffEditorReady = new ide_core_common_2.ReadyEvent();
        this.diffEditorDomReady = new ide_core_common_2.ReadyEvent();
        this.mergeEditorReady = new ide_core_common_2.ReadyEvent();
        this.mergeEditorDomReady = new ide_core_common_2.ReadyEvent();
        this._restoringState = false;
        this.eventBus.on(ide_core_browser_1.ResizeEvent, (e) => {
            if (e.payload.slotLocation === (0, ide_core_browser_1.getSlotLocation)('@opensumi/ide-editor', this.config.layoutConfig)) {
                this.doLayoutEditors();
            }
        });
        this.eventBus.on(types_2.GridResizeEvent, (e) => {
            if (e.payload.gridId === this.grid.uid) {
                this.doLayoutEditors();
            }
        });
        this.eventBus.on(types_2.EditorComponentDisposeEvent, (e) => {
            this.activeComponents.delete(e.payload);
            this.activateComponentsProps.delete(e.payload);
        });
        this.listenToExplorerAutoRevealConfig();
    }
    listenToExplorerAutoRevealConfig() {
        this.explorerAutoRevealConfig = !!this.preferenceService.get('explorer.autoReveal');
        this.disposables.push(this.preferenceService.onPreferenceChanged((change) => {
            if (change.preferenceName === 'explorer.autoReveal') {
                this.explorerAutoRevealConfig = change.newValue;
            }
        }));
    }
    attachDiffEditorDom(domNode) {
        if (!this._diffEditorDomNodeAttached) {
            this._diffEditorDomNode = domNode;
            this.diffEditorDomReady.ready();
            this._diffEditorDomNodeAttached = true;
        }
    }
    attachMergeEditorDom(domNode) {
        if (!this._mergeEditorDomNodeAttached) {
            this._mergeEditorDomNode = domNode;
            this.mergeEditorDomReady.ready();
            this._mergeEditorDomNodeAttached = true;
        }
    }
    attachToDom(domNode) {
        this._domNode = domNode;
        if (domNode) {
            this.contextKeyService.attachToDomNode(domNode);
            this.layoutEditors();
        }
    }
    layoutEditors() {
        if (this._domNode) {
            const currentWidth = this._domNode.offsetWidth;
            const currentHeight = this._domNode.offsetHeight;
            if (currentWidth !== this._prevDomWidth || currentHeight !== this._prevDomHeight) {
                this.doLayoutEditors();
            }
            this._prevDomWidth = currentWidth;
            this._prevDomHeight = currentHeight;
        }
    }
    doLayoutEditors() {
        if (this.codeEditor) {
            if (this.currentOpenType && this.currentOpenType.type === types_2.EditorOpenType.code) {
                this.codeEditor.layout();
                this._codeEditorPendingLayout = false;
            }
            else {
                this._codeEditorPendingLayout = true;
            }
        }
        if (this.diffEditor) {
            if (this.currentOpenType && this.currentOpenType.type === types_2.EditorOpenType.diff) {
                this.diffEditor.layout();
                this._diffEditorPendingLayout = false;
            }
            else {
                this._diffEditorPendingLayout = true;
            }
        }
        if (this.mergeEditor) {
            if (this.currentOpenType && this.currentOpenType.type === types_2.EditorOpenType.mergeEditor) {
                // this.mergeEditor.layout();
                this._mergeEditorPendingLayout = false;
            }
            else {
                this._mergeEditorPendingLayout = true;
            }
        }
    }
    setContextKeys() {
        var _a;
        if (!this._resourceContext) {
            const getLanguageFromModel = (uri) => {
                let result = null;
                const modelRef = this.documentModelManager.getModelReference(uri, 'resourceContextKey');
                if (modelRef) {
                    if (modelRef) {
                        result = modelRef.instance.languageId;
                    }
                    modelRef.dispose();
                }
                return result;
            };
            this._resourceContext = new resource_1.ResourceContextKey(this.contextKeyService, (uri) => {
                const res = getLanguageFromModel(uri);
                if (res) {
                    return res;
                }
                else {
                    return getLanguageFromModel(uri);
                }
            });
            this._diffResourceContextKey = new resource_1.ResourceContextKey(this.contextKeyService, (uri) => {
                const res = getLanguageFromModel(uri);
                if (res) {
                    return res;
                }
                else {
                    return getLanguageFromModel(uri);
                }
            }, 'diffResource');
            this._editorLangIDContextKey = this.contextKeyService.createKey('editorLangId', '');
            this._isInDiffEditorContextKey = this.contextKeyService.createKey('isInDiffEditor', false);
            this._isInDiffRightEditorContextKey = this.contextKeyService.createKey('isInDiffRightEditor', false);
            this._isInEditorComponentContextKey = this.contextKeyService.createKey('inEditorComponent', false);
        }
        if (this.currentOrPreviousFocusedEditor && this.currentOrPreviousFocusedEditor.currentUri) {
            this._resourceContext.set(this.currentOrPreviousFocusedEditor.currentUri);
            if (this.currentOrPreviousFocusedEditor.currentDocumentModel) {
                this._editorLangIDContextKey.set(this.currentOrPreviousFocusedEditor.currentDocumentModel.languageId);
            }
        }
        else if (this.currentEditor && this.currentEditor.currentUri) {
            this._resourceContext.set(this.currentEditor.currentUri);
            if (this.currentEditor.currentDocumentModel) {
                this._editorLangIDContextKey.set(this.currentEditor.currentDocumentModel.languageId);
            }
        }
        else {
            if (this.currentResource) {
                this._resourceContext.set(this.currentResource.uri);
            }
            else {
                this._resourceContext.reset();
            }
            this._editorLangIDContextKey.reset();
        }
        this._isInDiffEditorContextKey.set(this.isDiffEditorMode());
        // 没有 focus 的时候默认添加在 RightDiffEditor
        this._isInDiffRightEditorContextKey.set(this.isDiffEditorMode());
        this._isInEditorComponentContextKey.set(this.isComponentMode());
        if (this.isDiffEditorMode()) {
            this._diffResourceContextKey.set((_a = this.currentResource) === null || _a === void 0 ? void 0 : _a.uri);
        }
        this.updateContextKeyWhenDiffEditorChangesFocus();
    }
    updateContextKeyWhenDiffEditorChangesFocus() {
        if (this.updateContextKeyWhenEditorChangesFocusDisposer || !this.diffEditor) {
            return;
        }
        const emitIfNoEditorFocused = () => {
            if (!this.currentFocusedEditor) {
                this.setContextKeys();
                this._onDidEditorFocusChange.fire();
            }
        };
        this.updateContextKeyWhenEditorChangesFocusDisposer = new ide_core_common_2.Disposable(this.diffEditor.modifiedEditor.onFocus(() => {
            this._currentOrPreviousFocusedEditor = this.diffEditor.modifiedEditor;
            this.setContextKeys();
            this._onDidEditorFocusChange.fire();
        }), this.diffEditor.originalEditor.onFocus(() => {
            this._currentOrPreviousFocusedEditor = this.diffEditor.originalEditor;
            this.setContextKeys();
            this._onDidEditorFocusChange.fire();
        }), this.codeEditor.onFocus(() => {
            if (this.codeEditor.currentUri) {
                this.locateInFileTree(this.codeEditor.currentUri);
            }
            this._currentOrPreviousFocusedEditor = this.codeEditor;
            this.setContextKeys();
            this._onDidEditorFocusChange.fire();
        }), this.codeEditor.onBlur(emitIfNoEditorFocused), this.diffEditor.originalEditor.onBlur(emitIfNoEditorFocused), this.diffEditor.modifiedEditor.onBlur(emitIfNoEditorFocused));
        this.addDispose(this.updateContextKeyWhenEditorChangesFocusDisposer);
    }
    get contextKeyService() {
        if (!this._contextKeyService) {
            this._contextKeyService = this.workbenchEditorService.editorContextKeyService.createScoped();
        }
        return this._contextKeyService;
    }
    get index() {
        return this.workbenchEditorService.sortedEditorGroups.indexOf(this);
    }
    onResourceDecorationChangeEvent(e) {
        if (e.payload.decoration.dirty) {
            if (this.previewURI && this.previewURI.isEqual(e.payload.uri)) {
                this.pinPreviewed();
            }
        }
        const existingResource = this.resources.find((r) => r.uri.isEqual(e.payload.uri));
        if (existingResource) {
            this.notifyTabChanged();
        }
    }
    oResourceOpenTypeChangedEvent(e) {
        const uri = e.payload;
        if (this.cachedResourcesOpenTypes.has(uri.toString())) {
            this.cachedResourcesOpenTypes.delete(uri.toString());
        }
        if (this.currentResource && this.currentResource.uri.isEqual(uri)) {
            this._currentOpenType = null;
            this.notifyBodyChanged();
            this.displayResourceComponent(this.currentResource, {});
        }
    }
    async onRegisterEditorComponentEvent() {
        if (this.currentResource) {
            const resource = this.currentResource;
            const openTypes = await this.editorComponentRegistry.resolveEditorComponent(resource);
            if (this.currentResource === resource) {
                this.availableOpenTypes = openTypes;
                this.cachedResourcesOpenTypes.set(resource.uri.toString(), openTypes);
            }
        }
    }
    pinPreviewed(uri) {
        const previous = this.previewURI;
        if (uri === undefined) {
            this.previewURI = null;
        }
        else if (this.previewURI && this.previewURI.isEqual(uri)) {
            this.previewURI = null;
        }
        if (previous !== this.previewURI) {
            this.notifyTabChanged();
        }
    }
    notifyTabChanged() {
        if (this._restoringState) {
            return;
        }
        this._onDidEditorGroupTabChanged.fire();
    }
    notifyBodyChanged() {
        this._onDidEditorGroupBodyChanged.fire();
    }
    notifyTabLoading(resource) {
        this._onDidEditorGroupContentLoading.fire(resource);
    }
    get currentEditor() {
        if (this.currentOpenType) {
            if (this.currentOpenType.type === types_2.EditorOpenType.code) {
                return this.codeEditor;
            }
            else if (this.currentOpenType.type === types_2.EditorOpenType.diff) {
                return this.diffEditor.modifiedEditor;
            }
            else {
                return null;
            }
        }
        else {
            return null;
        }
    }
    get currentOrPreviousFocusedEditor() {
        return this._currentOrPreviousFocusedEditor || this.currentEditor;
    }
    get currentFocusedEditor() {
        if (this.currentOpenType) {
            if (this.currentOpenType.type === types_2.EditorOpenType.code) {
                if (this.codeEditor.monacoEditor.hasWidgetFocus()) {
                    return this.codeEditor;
                }
            }
            else if (this.currentOpenType.type === types_2.EditorOpenType.diff) {
                if (this.diffEditor.modifiedEditor.monacoEditor.hasTextFocus()) {
                    return this.diffEditor.modifiedEditor;
                }
                else if (this.diffEditor.originalEditor.monacoEditor.hasTextFocus()) {
                    return this.diffEditor.originalEditor;
                }
                if (this.diffEditor.modifiedEditor.monacoEditor.hasWidgetFocus()) {
                    return this.diffEditor.modifiedEditor;
                }
                else if (this.diffEditor.originalEditor.monacoEditor.hasWidgetFocus()) {
                    return this.diffEditor.originalEditor;
                }
            }
        }
        return null;
    }
    get currentCodeEditor() {
        if (this.currentOpenType) {
            if (this.currentOpenType.type === types_2.EditorOpenType.code) {
                return this.codeEditor;
            }
            else {
                return null;
            }
        }
        else {
            return null;
        }
    }
    createEditor(dom) {
        this.codeEditor = this.collectionService.createCodeEditor(dom, {}, {
            [ide_core_browser_1.ServiceNames.CONTEXT_KEY_SERVICE]: this.contextKeyService.contextKeyService,
        });
        setTimeout(() => {
            this.codeEditor.layout();
        });
        this.toDispose.push(this.codeEditor.onCursorPositionChanged((e) => {
            this._onCurrentEditorCursorChange.fire(e);
        }));
        this.toDispose.push(this.codeEditor.onSelectionsChanged((e) => {
            if (this.currentOpenType && this.currentOpenType.type === types_2.EditorOpenType.code) {
                this.eventBus.fire(new types_2.EditorSelectionChangeEvent({
                    group: this,
                    resource: this.currentResource,
                    selections: e.selections,
                    source: e.source,
                    editorUri: this.codeEditor.currentUri,
                }));
            }
        }));
        this.toDispose.push(this.codeEditor.onVisibleRangesChanged((e) => {
            if (this.currentOpenType && this.currentOpenType.type === types_2.EditorOpenType.code) {
                this.eventBus.fire(new types_2.EditorVisibleChangeEvent({
                    group: this,
                    resource: this.currentResource,
                    visibleRanges: e,
                    editorUri: this.codeEditor.currentUri,
                }));
            }
        }));
        this.toDispose.push(this.codeEditor.onConfigurationChanged(() => {
            if (this.currentOpenType && this.currentOpenType.type === types_2.EditorOpenType.code) {
                this.eventBus.fire(new types_2.EditorConfigurationChangedEvent({
                    group: this,
                    resource: this.currentResource,
                    editorUri: this.codeEditor.currentUri,
                }));
            }
        }));
        this.eventBus.fire(new types_2.CodeEditorDidVisibleEvent({
            groupName: this.name,
            type: types_2.EditorOpenType.code,
            editorId: this.codeEditor.getId(),
        }));
        this.codeEditorReady.ready();
    }
    createMergeEditor(dom) {
        this.mergeEditor = this.collectionService.createMergeEditor(dom, {}, {
            [ide_core_browser_1.ServiceNames.CONTEXT_KEY_SERVICE]: this.contextKeyService.contextKeyService,
        });
        this.mergeEditorReady.ready();
    }
    createDiffEditor(dom) {
        this.diffEditor = this.collectionService.createDiffEditor(dom, {}, {
            [ide_core_browser_1.ServiceNames.CONTEXT_KEY_SERVICE]: this.contextKeyService.contextKeyService,
        });
        setTimeout(() => {
            this.diffEditor.layout();
        });
        this.addDiffEditorEventListeners(this.diffEditor.originalEditor, 'original');
        this.addDiffEditorEventListeners(this.diffEditor.modifiedEditor, 'modified');
        this.eventBus.fire(new types_2.CodeEditorDidVisibleEvent({
            groupName: this.name,
            type: types_2.EditorOpenType.diff,
            editorId: this.diffEditor.modifiedEditor.getId(),
        }));
        this.eventBus.fire(new types_2.CodeEditorDidVisibleEvent({
            groupName: this.name,
            type: types_2.EditorOpenType.diff,
            editorId: this.diffEditor.originalEditor.getId(),
        }));
        this.diffEditorReady.ready();
    }
    addDiffEditorEventListeners(editor, side) {
        this.toDispose.push(editor.onSelectionsChanged((e) => {
            if (this.currentOpenType && this.currentOpenType.type === types_2.EditorOpenType.diff) {
                this.eventBus.fire(new types_2.EditorSelectionChangeEvent({
                    group: this,
                    resource: this.currentResource,
                    selections: e.selections,
                    source: e.source,
                    editorUri: ide_core_common_2.URI.from(editor.monacoEditor.getModel().uri),
                    side,
                }));
            }
        }));
        this.toDispose.push(editor.onVisibleRangesChanged((e) => {
            if (this.currentOpenType && this.currentOpenType.type === types_2.EditorOpenType.diff) {
                this.eventBus.fire(new types_2.EditorVisibleChangeEvent({
                    group: this,
                    resource: this.currentResource,
                    visibleRanges: e,
                    editorUri: editor.currentUri,
                }));
            }
        }));
        this.toDispose.push(editor.onConfigurationChanged(() => {
            if (this.currentOpenType && this.currentOpenType.type === types_2.EditorOpenType.diff) {
                this.eventBus.fire(new types_2.EditorConfigurationChangedEvent({
                    group: this,
                    resource: this.currentResource,
                    editorUri: editor.currentUri,
                }));
            }
        }));
    }
    async split(action, uri, options) {
        var _a, _b, _c;
        const editorGroup = this.workbenchEditorService.createEditorGroup();
        const direction = action === common_1.EditorGroupSplitAction.Left || action === common_1.EditorGroupSplitAction.Right
            ? grid_service_1.SplitDirection.Horizontal
            : grid_service_1.SplitDirection.Vertical;
        const before = action === common_1.EditorGroupSplitAction.Left || action === common_1.EditorGroupSplitAction.Top ? true : false;
        this.grid.split(direction, editorGroup, before);
        // 对于同一个编辑器分栏的场景，希望保留原本的滚动状态，与 VS Code 保持一致
        if (options && !options.scrollTop) {
            options.scrollTop = (_a = this.currentEditor) === null || _a === void 0 ? void 0 : _a.monacoEditor.getScrollTop();
        }
        if (options && !options.scrollLeft) {
            options.scrollLeft = (_b = this.currentEditor) === null || _b === void 0 ? void 0 : _b.monacoEditor.getScrollLeft();
        }
        if (options && !(options === null || options === void 0 ? void 0 : options.range)) {
            const selection = (_c = this.currentCodeEditor) === null || _c === void 0 ? void 0 : _c.monacoEditor.getSelection();
            if (selection) {
                options.range = new monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn);
            }
        }
        return editorGroup.open(uri, Object.assign(Object.assign({}, options), { preview: false, revealRangeInCenter: false }));
    }
    async open(uri, options = {}) {
        if (uri.scheme === ide_core_common_1.Schemes.file) {
            // 只记录 file 类型的
            this.recentFilesManager.setMostRecentlyOpenedFile(uri.withoutFragment().toString());
        }
        if (options && options.split) {
            return this.split(options.split, uri, Object.assign({}, options, { split: undefined, preview: false }));
        }
        if (!this.openingPromise.has(uri.toString())) {
            const promise = this.doOpen(uri, options);
            this.openingPromise.set(uri.toString(), promise);
            promise.then(() => {
                this.openingPromise.delete(uri.toString());
            }, () => {
                this.openingPromise.delete(uri.toString());
            });
        }
        const previewMode = this.preferenceService.get('editor.previewMode') && ((0, ide_core_common_1.isUndefinedOrNull)(options.preview) ? true : options.preview);
        if (!previewMode) {
            this.openingPromise.get(uri.toString()).then(() => {
                this.pinPreviewed(uri);
            });
        }
        return this.openingPromise.get(uri.toString());
    }
    async pin(uri) {
        return this.pinPreviewed(uri);
    }
    async doOpen(uri, options = {}) {
        var _a, _b, _c;
        if (!this.resourceService.handlesUri(uri)) {
            this.openerService.open(uri);
            return false;
        }
        let resourceReady;
        try {
            const previewMode = this.preferenceService.get('editor.previewMode') &&
                ((0, ide_core_common_1.isUndefinedOrNull)(options.preview) ? true : options.preview);
            if (this.currentResource &&
                this.currentResource.uri.isEqual(uri) &&
                // 当不存在 forceOpenType 或打开类型与当前打开类型符合时，才能说明是当前打开的 Reource 资源
                (!options.forceOpenType || options.forceOpenType.type === ((_a = this.currentOpenType) === null || _a === void 0 ? void 0 : _a.type))) {
                // 就是当前打开的 Resource
                if (options.focus && this.currentEditor) {
                    (_b = this._domNode) === null || _b === void 0 ? void 0 : _b.focus();
                    this.currentEditor.monacoEditor.focus();
                }
                if (options.range && this.currentEditor) {
                    this.currentEditor.monacoEditor.setSelection(options.range);
                    setTimeout(() => {
                        var _a;
                        (_a = this.currentEditor) === null || _a === void 0 ? void 0 : _a.monacoEditor.revealRangeInCenter(options.range, 0);
                    }, 0);
                }
                // 执行定位逻辑
                this.locationInTree(options, uri);
                this.notifyTabChanged();
                return {
                    group: this,
                    resource: this.currentResource,
                };
            }
            else {
                const oldOpenType = this._currentOpenType;
                const oldResource = this._currentResource;
                let resource = this.resources.find((r) => r.uri.toString() === uri.toString());
                if (!resource) {
                    // open new resource
                    resource = await this.resourceService.getResource(uri);
                    if (!resource) {
                        throw new Error('This uri cannot be opened!: ' + uri);
                    }
                    if (resource.deleted) {
                        if (options.deletedPolicy === 'fail') {
                            throw new Error('resource deleted ' + uri);
                        }
                        else if (options.deletedPolicy === 'skip') {
                            return false;
                        }
                    }
                    if (options && options.label) {
                        resource.name = options.label;
                    }
                    let replaceResource = null;
                    if (options && options.index !== undefined && options.index < this.resources.length) {
                        replaceResource = this.resources[options.index];
                        this.resources.splice(options.index, 0, resource);
                    }
                    else {
                        if (this.currentResource) {
                            const currentIndex = this.resources.indexOf(this.currentResource);
                            this.resources.splice(currentIndex + 1, 0, resource);
                            replaceResource = this.currentResource;
                        }
                        else {
                            this.resources.push(resource);
                        }
                    }
                    if (previewMode) {
                        if (this.previewURI) {
                            await this.close(this.previewURI, { treatAsNotCurrent: true, force: options.forceClose });
                        }
                        this.previewURI = resource.uri;
                    }
                    if (options.replace && replaceResource) {
                        await this.close(replaceResource.uri, { treatAsNotCurrent: true, force: options.forceClose });
                    }
                }
                if (options.backend) {
                    this.notifyTabChanged();
                    return false;
                }
                if (oldResource && this.resourceOpenHistory[this.resourceOpenHistory.length - 1] !== oldResource.uri) {
                    this.resourceOpenHistory.push(oldResource.uri);
                    const oldResourceSelections = (_c = this.currentCodeEditor) === null || _c === void 0 ? void 0 : _c.getSelections();
                    if (oldResourceSelections && oldResourceSelections.length > 0) {
                        this.recentFilesManager.updateMostRecentlyOpenedFile(oldResource.uri.toString(), {
                            lineNumber: oldResourceSelections[0].selectionStartLineNumber,
                            column: oldResourceSelections[0].selectionStartColumn,
                        });
                    }
                }
                this._currentOpenType = null;
                this._currentResource = resource;
                // 只有真正打开的文件才会走到这里，backend模式的只更新了tab，文件内容并未加载
                const reportTimer = this.reporterService.time(ide_core_common_1.REPORT_NAME.EDITOR_REACTIVE);
                resourceReady = new ide_core_common_2.Deferred();
                this.resourceStatus.set(resource, resourceReady.promise);
                // 超过60ms loading时间的才展示加载
                const delayTimer = setTimeout(() => {
                    this.notifyTabLoading(resource);
                }, 60);
                this.notifyTabChanged();
                this.notifyBodyChanged();
                await this.displayResourceComponent(resource, options);
                this._currentOrPreviousFocusedEditor = this.currentEditor;
                clearTimeout(delayTimer);
                resourceReady.resolve();
                reportTimer.timeEnd(resource.uri.toString());
                this._onDidEditorFocusChange.fire();
                this.setContextKeys();
                this.eventBus.fire(new types_2.EditorGroupOpenEvent({
                    group: this,
                    resource,
                }));
                // 执行定位逻辑
                this.locationInTree(options, uri);
                this.eventBus.fire(new types_2.EditorGroupChangeEvent({
                    group: this,
                    newOpenType: this.currentOpenType,
                    newResource: this.currentResource,
                    oldOpenType,
                    oldResource,
                }));
                return {
                    group: this,
                    resource,
                };
            }
        }
        catch (e) {
            (0, ide_core_common_2.getDebugLogger)().error(e);
            resourceReady && resourceReady.reject();
            if (!(0, error_1.isEditorError)(e, error_1.EditorTabChangedError)) {
                this.messageService.error((0, ide_core_common_2.formatLocalize)('editor.failToOpen', uri.displayName, e.message), [], true);
            }
            return false;
            // todo 给用户显示error
        }
    }
    locationInTree(options, uri) {
        if (!(options === null || options === void 0 ? void 0 : options.backend)) {
            if (!(options === null || options === void 0 ? void 0 : options.disableNavigate)) {
                this.locateInFileTree(uri);
            }
            if (!options.disableNavigateOnOpendEditor) {
                this.locateInOpenedEditor(uri);
            }
        }
    }
    locateInFileTree(uri) {
        if (this.explorerAutoRevealConfig) {
            this.commands.tryExecuteCommand(ide_core_browser_1.FILE_COMMANDS.LOCATION.id, uri);
        }
    }
    locateInOpenedEditor(uri) {
        if (this.explorerAutoRevealConfig) {
            this.commands.tryExecuteCommand(ide_core_browser_1.OPEN_EDITORS_COMMANDS.LOCATION.id, uri);
        }
    }
    async openUris(uris) {
        for (const uri of uris) {
            await this.open(uri);
        }
    }
    async getDocumentModelRef(uri) {
        if (!this.holdDocumentModelRefs.has(uri.toString())) {
            this.holdDocumentModelRefs.set(uri.toString(), await this.documentModelManager.createModelReference(uri, 'editor-group-' + this.name));
        }
        return this.holdDocumentModelRefs.get(uri.toString());
    }
    disposeDocumentRef(uri) {
        if (uri.scheme === 'diff') {
            const query = uri.getParsedQuery();
            this.doDisposeDocRef(new ide_core_common_2.URI(query.original));
            this.doDisposeDocRef(new ide_core_common_2.URI(query.modified));
        }
        else {
            this.doDisposeDocRef(uri);
        }
    }
    doDisposeDocRef(uri) {
        if (this.holdDocumentModelRefs.has(uri.toString())) {
            this.holdDocumentModelRefs.get(uri.toString()).dispose();
            this.holdDocumentModelRefs.delete(uri.toString());
        }
    }
    async openCodeEditor(resource, options) {
        this.resolveTabChanged(resource, this.currentResource);
        await this.codeEditorReady.onceReady(async () => {
            var _a;
            const documentRef = await this.getDocumentModelRef(resource.uri);
            await this.codeEditor.open(documentRef);
            if (options.range) {
                const range = new monaco.Range(options.range.startLineNumber, options.range.startColumn, options.range.endLineNumber, options.range.endColumn);
                // 这里使用 setTimeout 在下一次事件循环时将编辑器滚动到指定位置
                // 原因是在打开新文件的情况下
                // setModel 后立即调用 revealRangeInCenter 编辑器无法获取到 viewport 宽高
                // 导致无法正确计算滚动位置
                this.codeEditor.monacoEditor.setSelection(range);
                if (options.revealRangeInCenter) {
                    setTimeout(() => {
                        this.codeEditor.monacoEditor.revealRangeInCenter(range, 1);
                    });
                }
            }
            // 同上
            queueMicrotask(() => {
                if (options.scrollTop) {
                    this.codeEditor.monacoEditor.setScrollTop(options.scrollTop);
                }
                if (options.scrollLeft) {
                    this.codeEditor.monacoEditor.setScrollLeft(options.scrollLeft);
                }
            });
            if (options.focus) {
                (_a = this._domNode) === null || _a === void 0 ? void 0 : _a.focus();
                // monaco 编辑器的 focus 多了一步检查，由于此时其实对应编辑器的 dom 的 display 为 none （需要等 React 下一次渲染才会改变为 block）,
                // 会引起 document.activeElement !== editor.textArea.domNode，进而会导致focus失败
                // 需要等待真正 append 之后再
                const disposer = this.eventBus.on(types_2.CodeEditorDidVisibleEvent, (e) => {
                    var _a;
                    if (e.payload.groupName === this.name && e.payload.type === types_2.EditorOpenType.code) {
                        disposer.dispose();
                        // 此处必须多做一些检查以免不必要的 focus
                        if (this.disposed) {
                            return;
                        }
                        if (this !== this.workbenchEditorService.currentEditorGroup) {
                            return;
                        }
                        if (this.currentEditor === this.codeEditor && ((_a = this.codeEditor.currentUri) === null || _a === void 0 ? void 0 : _a.isEqual(resource.uri))) {
                            try {
                                this.codeEditor.focus();
                            }
                            catch (e) {
                                // noop
                            }
                        }
                    }
                });
            }
            // 可能在diff Editor中修改导致为脏
            if (documentRef.instance.dirty) {
                this.pinPreviewed(resource.uri);
            }
        });
    }
    async openDiffEditor(resource, options) {
        if (!this.diffEditor) {
            await this.diffEditorDomReady.onceReady(() => {
                var _a;
                const container = document.createElement('div');
                (_a = this._diffEditorDomNode) === null || _a === void 0 ? void 0 : _a.appendChild(container);
                this.createDiffEditor(container);
            });
        }
        const diffResource = resource;
        const [original, modified] = await Promise.all([
            this.getDocumentModelRef(diffResource.metadata.original),
            this.getDocumentModelRef(diffResource.metadata.modified),
        ]);
        await this.diffEditorReady.onceReady(async () => {
            var _a;
            if (!original || !modified) {
                return;
            }
            await this.diffEditor.compare(original, modified, options, resource.uri);
            if (options.focus) {
                (_a = this._domNode) === null || _a === void 0 ? void 0 : _a.focus();
                // 理由见上方 codeEditor.focus 部分
                const disposer = this.eventBus.on(types_2.CodeEditorDidVisibleEvent, (e) => {
                    if (e.payload.groupName === this.name && e.payload.type === types_2.EditorOpenType.diff) {
                        disposer.dispose();
                        if (this.disposed) {
                            return;
                        }
                        if (this !== this.workbenchEditorService.currentEditorGroup) {
                            return;
                        }
                        if (this.currentEditor === this.diffEditor.modifiedEditor) {
                            try {
                                this.diffEditor.focus();
                            }
                            catch (e) {
                                // noop
                            }
                        }
                    }
                });
            }
        });
    }
    async openMergeEditor(resource) {
        const { metadata } = resource;
        if (!metadata) {
            return;
        }
        if (!this.mergeEditor) {
            await this.mergeEditorDomReady.onceReady(() => {
                var _a;
                const container = document.createElement('div');
                (_a = this._mergeEditorDomNode) === null || _a === void 0 ? void 0 : _a.appendChild(container);
                this.createMergeEditor(container);
            });
        }
        const { ancestor, input1, input2, output } = metadata;
        const input1Data = merge_editor_widget_1.MergeEditorInputData.from(input1);
        const input2Data = merge_editor_widget_1.MergeEditorInputData.from(input2);
        const [ancestorRef, input1Ref, outputRef, input2Ref] = await Promise.all([
            this.getDocumentModelRef(ide_core_common_2.URI.parse(ancestor)),
            this.getDocumentModelRef(input1Data.uri),
            this.getDocumentModelRef(ide_core_common_2.URI.parse(output)),
            this.getDocumentModelRef(input2Data.uri),
        ]);
        await this.mergeEditorReady.onceReady(async () => {
            await this.mergeEditor.open({
                ancestor: {
                    uri: ide_core_common_2.URI.parse(metadata.ancestor),
                    textModel: ancestorRef.instance.getMonacoModel(),
                    baseContent: ancestorRef.instance.baseContent || '',
                },
                input1: input1Data.setTextModel(input1Ref.instance.getMonacoModel()),
                input2: input2Data.setTextModel(input2Ref.instance.getMonacoModel()),
                output: {
                    uri: ide_core_common_2.URI.parse(metadata.output),
                    textModel: outputRef.instance.getMonacoModel(),
                },
            });
        });
    }
    async openCustomEditor(resource, componentId) {
        const component = this.editorComponentRegistry.getEditorComponent(componentId);
        const initialProps = this.editorComponentRegistry.getEditorInitialProps(componentId);
        if (!component) {
            throw new Error('Cannot find Editor Component with id: ' + componentId);
        }
        else {
            this.activateComponentsProps.set(component, initialProps);
            if (component.renderMode === types_2.EditorComponentRenderMode.ONE_PER_RESOURCE) {
                const openedResources = this.activeComponents.get(component) || [];
                const index = openedResources.findIndex((r) => r.uri.toString() === resource.uri.toString());
                if (index === -1) {
                    openedResources.push(resource);
                }
                this.activeComponents.set(component, openedResources);
            }
            else if (component.renderMode === types_2.EditorComponentRenderMode.ONE_PER_GROUP) {
                this.activeComponents.set(component, [resource]);
            }
            else if (component.renderMode === types_2.EditorComponentRenderMode.ONE_PER_WORKBENCH) {
                const promises = [];
                this.workbenchEditorService.editorGroups.forEach((g) => {
                    if (g === this) {
                        return;
                    }
                    const r = g.resources.find((r) => r.uri.isEqual(resource.uri));
                    if (r) {
                        promises.push(g.close(r.uri));
                    }
                });
                await Promise.all(promises).catch((0, ide_core_common_2.getDebugLogger)().error);
                this.activeComponents.set(component, [resource]);
            }
        }
        // 打开非编辑器的component时需要手动触发
        this._onCurrentEditorCursorChange.fire({
            position: null,
            selectionLength: 0,
        });
    }
    async displayResourceComponent(resource, options) {
        if (options.revealRangeInCenter === undefined) {
            options.revealRangeInCenter = true;
        }
        const _resource = resource;
        const result = await this.resolveOpenType(resource, options);
        if (result) {
            const { activeOpenType, openTypes } = result;
            this.availableOpenTypes = openTypes;
            if (options.preserveFocus) {
                options.focus = false;
            }
            switch (activeOpenType.type) {
                case types_2.EditorOpenType.code:
                    await this.openCodeEditor(resource, options);
                    break;
                case types_2.EditorOpenType.diff:
                    await this.openDiffEditor(resource, options);
                    break;
                case types_2.EditorOpenType.mergeEditor:
                    await this.openMergeEditor(resource);
                    break;
                case types_2.EditorOpenType.component:
                    await this.openCustomEditor(resource, activeOpenType.componentId);
                    break;
                default:
                    return;
            }
            this.resolveTabChanged(_resource, this.currentResource);
            this._currentOpenType = activeOpenType;
            this.notifyBodyChanged();
            if ((!this._codeEditorPendingLayout && activeOpenType.type === types_2.EditorOpenType.code) ||
                (!this._diffEditorPendingLayout && activeOpenType.type === types_2.EditorOpenType.diff) ||
                (!this._mergeEditorPendingLayout && activeOpenType.type === types_2.EditorOpenType.mergeEditor)) {
                this.doLayoutEditors();
            }
            this.cachedResourcesActiveOpenTypes.set(resource.uri.toString(), activeOpenType);
        }
    }
    resolveTabChanged(lastResource, curResource) {
        if (lastResource !== curResource) {
            // 打开过程中改变了tab
            throw new error_1.EditorTabChangedError();
        }
    }
    async resolveOpenType(resource, options) {
        const openTypes = this.cachedResourcesOpenTypes.get(resource.uri.toString()) ||
            (await this.editorComponentRegistry.resolveEditorComponent(resource));
        const editorAssociations = this.preferenceService.get('workbench.editorAssociations');
        const activeOpenType = findSuitableOpenType(openTypes, this.cachedResourcesActiveOpenTypes.get(resource.uri.toString()), resource, editorAssociations, options.forceOpenType);
        this.cachedResourcesOpenTypes.set(resource.uri.toString(), openTypes);
        return { activeOpenType, openTypes };
    }
    async close(uri, { treatAsNotCurrent, force, } = {}) {
        const index = this.resources.findIndex((r) => r.uri.toString() === uri.toString());
        if (index !== -1) {
            const resource = this.resources[index];
            if (!force) {
                if (!(await this.shouldClose(resource))) {
                    return;
                }
            }
            this.resources.splice(index, 1);
            this.eventBus.fire(new types_2.EditorGroupCloseEvent({
                group: this,
                resource,
            }));
            if (this.previewURI && this.previewURI.isEqual(uri)) {
                this.previewURI = null;
            }
            // 优先打开用户打开历史中的uri,
            // 如果历史中的不可打开，打开去除当前关闭目标uri后相同位置的uri, 如果没有，则一直往前找到第一个可用的uri
            if (resource === this.currentResource && !treatAsNotCurrent) {
                let nextUri;
                while (this.resourceOpenHistory.length > 0) {
                    if (this.resources.findIndex((r) => r.uri === this.resourceOpenHistory[this.resourceOpenHistory.length - 1]) !==
                        -1) {
                        nextUri = this.resourceOpenHistory.pop();
                        break;
                    }
                    else {
                        this.resourceOpenHistory.pop();
                    }
                }
                if (nextUri) {
                    this.open(nextUri);
                }
                else {
                    let i = index;
                    while (i > 0 && !this.resources[i]) {
                        i--;
                    }
                    if (this.resources[i]) {
                        this.open(this.resources[i].uri);
                    }
                    else {
                        this.backToEmpty();
                    }
                }
            }
            else {
                this.notifyTabChanged();
            }
            for (const resources of this.activeComponents.values()) {
                const i = resources.indexOf(resource);
                if (i !== -1) {
                    resources.splice(i, 1);
                }
            }
            this.disposeDocumentRef(uri);
        }
        if (this.resources.length === 0) {
            if (this.grid.parent) {
                // 当前不是最后一个 editor Group
                this.dispose();
            }
            this.availableOpenTypes = [];
        }
    }
    async shouldClose(resource) {
        // TODO: 自定义打开方式如果存在保存能力，也要能阻止关闭
        const openedResources = this.workbenchEditorService.editorGroups.map((group) => group.resources);
        if (!(await this.resourceService.shouldCloseResource(resource, openedResources))) {
            return false;
        }
        else {
            let count = 0;
            for (const group of openedResources) {
                for (const res of group) {
                    if (res.uri.isEqual(resource.uri)) {
                        count++;
                        if (count >= 2) {
                            break;
                        }
                    }
                }
            }
            if (count <= 1) {
                this.resourceService.disposeResource(resource);
            }
            return true;
        }
    }
    backToEmpty() {
        const oldOpenType = this._currentOpenType;
        const oldResource = this._currentResource;
        this._currentResource = null;
        this._currentOpenType = null;
        this.notifyTabChanged();
        this.notifyBodyChanged();
        this._currentOrPreviousFocusedEditor = null;
        this._onDidEditorFocusChange.fire();
        // 关闭最后一个时，应该发送一个 EditorGroupChangeEvent
        this.eventBus.fire(new types_2.EditorGroupChangeEvent({
            group: this,
            newOpenType: this.currentOpenType,
            newResource: this.currentResource,
            oldOpenType,
            oldResource,
        }));
    }
    /**
     * 关闭全部
     */
    async closeAll() {
        for (const resource of this.resources) {
            if (!(await this.shouldClose(resource))) {
                return;
            }
        }
        const closed = this.resources.splice(0, this.resources.length);
        closed.forEach((resource) => {
            this.clearResourceOnClose(resource);
        });
        this.activeComponents.clear();
        if (this.workbenchEditorService.editorGroups.length > 1) {
            this.dispose();
        }
        this.previewURI = null;
        this.backToEmpty();
    }
    /**
     * 关闭已保存（非dirty）
     */
    async closeSaved() {
        const saved = this.resources.filter((r) => {
            const decoration = this.resourceService.getResourceDecoration(r.uri);
            if (!decoration || !decoration.dirty) {
                return true;
            }
        });
        for (const resource of saved) {
            if (!(await this.shouldClose(resource))) {
                return;
            }
        }
        for (const resource of saved) {
            await this.close(resource.uri);
        }
    }
    /**
     * 关闭向右的tab
     * @param uri
     */
    async closeToRight(uri) {
        const index = this.resources.findIndex((r) => r.uri.toString() === uri.toString());
        if (index !== -1) {
            const resourcesToClose = this.resources.slice(index + 1);
            for (const resource of resourcesToClose) {
                if (!(await this.shouldClose(resource))) {
                    return;
                }
            }
            this.resources.splice(index + 1);
            for (const resource of resourcesToClose) {
                this.clearResourceOnClose(resource);
            }
            this.open(uri);
        }
    }
    clearResourceOnClose(resource) {
        this.eventBus.fire(new types_2.EditorGroupCloseEvent({
            group: this,
            resource,
        }));
        for (const resources of this.activeComponents.values()) {
            const i = resources.indexOf(resource);
            if (i !== -1) {
                resources.splice(i, 1);
            }
        }
    }
    async closeOthers(uri) {
        const index = this.resources.findIndex((r) => r.uri.toString() === uri.toString());
        if (index !== -1) {
            const resourcesToClose = this.resources.filter((v, i) => i !== index);
            for (const resource of resourcesToClose) {
                if (!(await this.shouldClose(resource))) {
                    return;
                }
            }
            this.resources = [this.resources[index]];
            for (const resource of resourcesToClose) {
                this.clearResourceOnClose(resource);
            }
            await this.open(uri);
        }
    }
    /**
     * 当前打开的resource
     */
    get currentResource() {
        return this._currentResource;
    }
    get currentOpenType() {
        return this._currentOpenType;
    }
    async changeOpenType(id) {
        const type = this.availableOpenTypes.find((a) => a.type === id || a.componentId === id);
        if (!type) {
            return;
        }
        if (!this.currentResource) {
            return;
        }
        if (openTypeSimilar(type, this.currentOpenType)) {
            return;
        }
        const oldOpenType = this.currentOpenType;
        await this.displayResourceComponent(this.currentResource, { forceOpenType: type });
        this.eventBus.fire(new types_2.EditorGroupChangeEvent({
            group: this,
            newOpenType: this.currentOpenType,
            newResource: this.currentResource,
            oldOpenType,
            oldResource: this.currentResource,
        }));
    }
    /**
     * 拖拽drop方法
     */
    async dropUri(uri, position, sourceGroup, targetResource) {
        if (position !== types_2.DragOverPosition.CENTER) {
            await this.split((0, common_1.getSplitActionFromDragDrop)(position), uri, { preview: false, focus: true });
        }
        else {
            // 扔在本体或者tab上
            if (!targetResource) {
                await this.open(uri, { preview: false, focus: true });
            }
            else {
                const targetIndex = this.resources.indexOf(targetResource);
                if (targetIndex === -1) {
                    await this.open(uri, { preview: false, focus: true });
                }
                else {
                    const sourceIndex = this.resources.findIndex((resource) => resource.uri.toString() === uri.toString());
                    if (sourceIndex === -1) {
                        await this.open(uri, {
                            index: targetIndex,
                            preview: false,
                        });
                    }
                    else {
                        // just move
                        const sourceResource = this.resources[sourceIndex];
                        if (sourceIndex > targetIndex) {
                            this.resources.splice(sourceIndex, 1);
                            this.resources.splice(targetIndex, 0, sourceResource);
                            await this.open(uri, { preview: false });
                        }
                        else if (sourceIndex < targetIndex) {
                            this.resources.splice(targetIndex + 1, 0, sourceResource);
                            this.resources.splice(sourceIndex, 1);
                            await this.open(uri, { preview: false });
                        }
                    }
                }
            }
        }
        if (sourceGroup) {
            if (sourceGroup !== this) {
                // 从其他group拖动过来
                await sourceGroup.close(uri);
            }
            else if (position !== types_2.DragOverPosition.CENTER) {
                // split行为
                await this.close(uri);
            }
        }
    }
    gainFocus() {
        this.workbenchEditorService.setCurrentGroup(this);
    }
    focus() {
        this.gainFocus();
        if (this.currentOpenType && this.currentOpenType.type === types_2.EditorOpenType.code) {
            this.codeEditor.focus();
        }
        if (this.currentOpenType && this.currentOpenType.type === types_2.EditorOpenType.diff) {
            this.diffEditor.focus();
        }
    }
    dispose() {
        var _a;
        (_a = this.grid) === null || _a === void 0 ? void 0 : _a.dispose();
        this.workbenchEditorService.removeGroup(this);
        super.dispose();
        this.codeEditor && this.codeEditor.dispose();
        this.diffEditor && this.diffEditor.dispose();
        this.toDispose.forEach((disposable) => disposable.dispose());
        this.eventBus.fire(new types_2.EditorGroupDisposeEvent({
            group: this,
        }));
    }
    getState() {
        const uris = this.resources.filter(couldRevive).map((r) => r.uri.toString());
        return {
            uris,
            current: this.currentResource && couldRevive(this.currentResource) ? this.currentResource.uri.toString() : undefined,
            previewIndex: this.previewURI ? uris.indexOf(this.previewURI.toString()) : -1,
        };
    }
    isCodeEditorMode() {
        return !!this.currentOpenType && this.currentOpenType.type === types_2.EditorOpenType.code;
    }
    isDiffEditorMode() {
        return !!this.currentOpenType && this.currentOpenType.type === types_2.EditorOpenType.diff;
    }
    isComponentMode() {
        return !!this.currentOpenType && this.currentOpenType.type === types_2.EditorOpenType.component;
    }
    async restoreState(state) {
        this._restoringState = true;
        this.previewURI = state.uris[state.previewIndex] ? new ide_core_common_2.URI(state.uris[state.previewIndex]) : null;
        await Promise.all(state.uris.map(async (uri) => {
            await this.doOpen(new ide_core_common_2.URI(uri), {
                disableNavigate: true,
                backend: true,
                preview: false,
                deletedPolicy: 'skip',
            });
        }));
        let targetUri;
        if (state.current) {
            targetUri = new ide_core_common_2.URI(state.current);
        }
        else {
            if (state.uris.length > 0) {
                targetUri = new ide_core_common_2.URI(state.uris[state.uris.length - 1]);
            }
        }
        if (targetUri) {
            if (!(await this.open(targetUri, { deletedPolicy: 'skip' }))) {
                if (this.resources[0]) {
                    await this.open(this.resources[0].uri);
                }
            }
        }
        this._restoringState = false;
        this.notifyTabChanged();
    }
    async saveAll(includeUntitled, reason) {
        for (const r of this.resources) {
            // 不保存无标题文件
            if (!includeUntitled && r.uri.scheme === ide_core_common_1.Schemes.untitled) {
                continue;
            }
            await this.saveResource(r, reason);
        }
    }
    async saveResource(resource, reason = common_1.SaveReason.Manual) {
        // 尝试使用 openType 提供的保存方法保存
        if (await this.saveByOpenType(resource, reason)) {
            return;
        }
        // 否则使用 document 进行保存 (如果有)
        const docRef = this.documentModelManager.getModelReference(resource.uri);
        if (docRef) {
            if (docRef.instance.dirty) {
                await docRef.instance.save(undefined, reason);
            }
            docRef.dispose();
        }
    }
    async saveByOpenType(resource, reason) {
        const openType = this.cachedResourcesActiveOpenTypes.get(resource.uri.toString());
        if (openType && openType.saveResource) {
            try {
                await openType.saveResource(resource, reason);
                return true;
            }
            catch (e) {
                this.logger.error(e);
            }
        }
        return false;
    }
    async saveCurrent(reason = common_1.SaveReason.Manual) {
        const resource = this.currentResource;
        if (!resource) {
            return;
        }
        if (await this.saveByOpenType(resource, reason)) {
            return;
        }
        if (this.currentEditor) {
            return this.currentEditor.save();
        }
    }
    hasDirty() {
        for (const r of this.resources) {
            const docRef = this.documentModelManager.getModelReference(r.uri);
            if (docRef) {
                const isDirty = docRef.instance.dirty;
                docRef.dispose();
                if (isDirty) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * 计算 dirty 数量
     */
    calcDirtyCount(countedUris = new Set()) {
        let count = 0;
        for (const r of this.resources) {
            const docRef = this.documentModelManager.getModelReference(r.uri, 'calc-dirty-count');
            if (countedUris.has(r.uri.toString())) {
                continue;
            }
            countedUris.add(r.uri.toString());
            if (docRef) {
                const isDirty = docRef.instance.dirty;
                docRef.dispose();
                if (isDirty) {
                    count += 1;
                }
            }
        }
        return count;
    }
    componentUndo() {
        const currentOpenType = this.currentOpenType;
        if (currentOpenType === null || currentOpenType === void 0 ? void 0 : currentOpenType.undo) {
            currentOpenType.undo(this.currentResource);
        }
    }
    componentRedo() {
        const currentOpenType = this.currentOpenType;
        if (currentOpenType === null || currentOpenType === void 0 ? void 0 : currentOpenType.redo) {
            currentOpenType.redo(this.currentResource);
        }
    }
    /**
     * 防止作为参数被抛入插件进程时出错
     */
    toJSON() {
        return {
            name: this.name,
        };
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(),
    tslib_1.__metadata("design:type", common_1.EditorCollectionService)
], EditorGroup.prototype, "collectionService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(),
    tslib_1.__metadata("design:type", common_1.ResourceService)
], EditorGroup.prototype, "resourceService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(),
    tslib_1.__metadata("design:type", types_2.EditorComponentRegistry)
], EditorGroup.prototype, "editorComponentRegistry", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(common_1.WorkbenchEditorService),
    tslib_1.__metadata("design:type", WorkbenchEditorServiceImpl)
], EditorGroup.prototype, "workbenchEditorService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(types_1.IEditorDocumentModelService),
    tslib_1.__metadata("design:type", Object)
], EditorGroup.prototype, "documentModelManager", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_common_2.CommandService),
    tslib_1.__metadata("design:type", Object)
], EditorGroup.prototype, "commands", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.PreferenceService),
    tslib_1.__metadata("design:type", Object)
], EditorGroup.prototype, "preferenceService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.RecentFilesManager),
    tslib_1.__metadata("design:type", ide_core_browser_1.RecentFilesManager)
], EditorGroup.prototype, "recentFilesManager", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_overlay_1.IMessageService),
    tslib_1.__metadata("design:type", Object)
], EditorGroup.prototype, "messageService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_common_2.IReporterService),
    tslib_1.__metadata("design:type", Object)
], EditorGroup.prototype, "reporterService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.AppConfig),
    tslib_1.__metadata("design:type", Object)
], EditorGroup.prototype, "config", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.IOpenerService),
    tslib_1.__metadata("design:type", Object)
], EditorGroup.prototype, "openerService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_common_2.ILogger),
    tslib_1.__metadata("design:type", Object)
], EditorGroup.prototype, "logger", void 0);
tslib_1.__decorate([
    mobx_1.observable.shallow,
    tslib_1.__metadata("design:type", Array)
], EditorGroup.prototype, "availableOpenTypes", void 0);
tslib_1.__decorate([
    (0, ide_core_common_1.debounce)(100),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], EditorGroup.prototype, "doLayoutEditors", null);
tslib_1.__decorate([
    (0, ide_core_common_2.OnEvent)(common_1.ResourceDecorationChangeEvent),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [common_1.ResourceDecorationChangeEvent]),
    tslib_1.__metadata("design:returntype", void 0)
], EditorGroup.prototype, "onResourceDecorationChangeEvent", null);
tslib_1.__decorate([
    (0, ide_core_common_2.OnEvent)(types_2.ResourceOpenTypeChangedEvent),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [types_2.ResourceOpenTypeChangedEvent]),
    tslib_1.__metadata("design:returntype", void 0)
], EditorGroup.prototype, "oResourceOpenTypeChangedEvent", null);
tslib_1.__decorate([
    (0, ide_core_common_2.OnEvent)(types_2.RegisterEditorComponentEvent),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], EditorGroup.prototype, "onRegisterEditorComponentEvent", null);
EditorGroup = tslib_1.__decorate([
    (0, di_1.Injectable)({ multiple: true }),
    tslib_1.__metadata("design:paramtypes", [String])
], EditorGroup);
exports.EditorGroup = EditorGroup;
function findSuitableOpenType(currentAvailable, prev, resource, editorAssociations, forceOpenType) {
    if (forceOpenType) {
        return currentAvailable.find((p) => openTypeSimilar(p, forceOpenType)) || currentAvailable[0];
    }
    else if (prev) {
        return currentAvailable.find((p) => openTypeSimilar(p, prev)) || currentAvailable[0];
    }
    if (editorAssociations) {
        // 如果配置了 workbench.editorAssociations 且 priority 为 option 的情况下符合规则的默认打开方式行为
        const matchAvailableType = currentAvailable.find((p) => {
            const matchAssKey = Object.keys(editorAssociations).find((r) => (0, ide_core_common_1.match)(r, resource.uri.path.toString().toLowerCase()) || (0, ide_core_common_1.match)(r, resource.uri.path.base.toLowerCase()));
            const viewType = matchAssKey && editorAssociations[matchAssKey];
            if (!viewType) {
                return false;
            }
            const componentId = `${ide_core_common_1.CUSTOM_EDITOR_SCHEME}-${viewType}`;
            return p.componentId === componentId;
        });
        if (matchAvailableType) {
            return matchAvailableType;
        }
    }
    return currentAvailable[0];
}
function openTypeSimilar(a, b) {
    return a.type === b.type && (a.type !== types_2.EditorOpenType.component || a.componentId === b.componentId);
}
//# sourceMappingURL=workbench-editor.service.js.map