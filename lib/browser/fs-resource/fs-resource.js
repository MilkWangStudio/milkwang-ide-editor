"use strict";
var FileSystemResourceProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemResourceProvider = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const services_1 = require("@opensumi/ide-core-browser/lib/services");
const ide_core_common_1 = require("@opensumi/ide-core-common");
const common_1 = require("@opensumi/ide-file-service/lib/common");
const ide_overlay_1 = require("@opensumi/ide-overlay");
const common_2 = require("../../common");
const common_3 = require("../../common");
const types_1 = require("../doc-model/types");
const file_tree_set_1 = require("./file-tree-set");
const { Path } = ide_core_common_1.path;
let FileSystemResourceProvider = FileSystemResourceProvider_1 = class FileSystemResourceProvider extends ide_core_browser_1.WithEventBus {
    constructor() {
        super();
        this.cachedFileStat = new ide_core_browser_1.LRUMap(200, 100);
        this.ready = this.init();
        this.listen();
    }
    async init() {
        const os = await this.applicationService.getBackendOS();
        this.involvedFiles = new file_tree_set_1.FileTreeSet(os === ide_core_browser_1.OperatingSystem.Windows);
    }
    handlesUri(uri) {
        const scheme = uri.scheme;
        if (this.fileServiceClient.handlesScheme(scheme)) {
            return 10;
        }
        else {
            return -1;
        }
    }
    listen() {
        this.fileServiceClient.onFilesChanged((e) => {
            e.forEach((change) => {
                var _a;
                if (change.type === ide_core_common_1.FileChangeType.ADDED || change.type === ide_core_common_1.FileChangeType.DELETED) {
                    // 对于文件夹的删除，做要传递给子文件
                    const effectedPaths = (_a = this.involvedFiles) === null || _a === void 0 ? void 0 : _a.effects(new ide_core_browser_1.URI(change.uri).codeUri.fsPath);
                    effectedPaths.forEach((p) => {
                        const effected = ide_core_browser_1.URI.file(p);
                        this.cachedFileStat.delete(effected.toString());
                        this.eventBus.fire(new common_2.ResourceNeedUpdateEvent(effected));
                    });
                }
                else {
                    // Linux下，可能 update 事件代表了 create
                    // 此时如果 cached 是undefined，就更新
                    if (this.cachedFileStat.has(change.uri) && this.cachedFileStat.get(change.uri) === undefined) {
                        this.cachedFileStat.delete(change.uri);
                        this.eventBus.fire(new common_2.ResourceNeedUpdateEvent(new ide_core_browser_1.URI(change.uri)));
                    }
                }
            });
        });
        this.labelService.onDidChange((uri) => {
            var _a;
            if (uri.codeUri.fsPath && ((_a = this.involvedFiles) === null || _a === void 0 ? void 0 : _a.effects(uri.codeUri.fsPath))) {
                this.eventBus.fire(new common_2.ResourceNeedUpdateEvent(uri));
            }
        });
    }
    async getFileStat(uri) {
        if (!this.cachedFileStat.has(uri)) {
            this.cachedFileStat.set(uri, await this.fileServiceClient.getFileStat(uri.toString()));
        }
        return this.cachedFileStat.get(uri);
    }
    async getCurrentUserHome() {
        if (!this.userhomePath) {
            try {
                const userhome = await this.fileServiceClient.getCurrentUserHome();
                if (userhome) {
                    this.userhomePath = new ide_core_browser_1.URI(userhome.uri);
                }
            }
            catch (err) { }
        }
        return this.userhomePath;
    }
    async getReadableTooltip(path) {
        const pathStr = path.toString();
        const userhomePath = await this.getCurrentUserHome();
        if (!userhomePath) {
            return decodeURIComponent(path.withScheme('').toString());
        }
        if (userhomePath.isEqualOrParent(path)) {
            const userhomePathStr = userhomePath && userhomePath.toString();
            return decodeURIComponent(pathStr.replace(userhomePathStr, '~'));
        }
        return decodeURIComponent(path.withScheme('').toString());
    }
    async provideResource(uri) {
        // 获取文件类型 getFileType: (path: string) => string
        await this.ready;
        this.involvedFiles.add(uri.codeUri.fsPath);
        return Promise.all([
            this.getFileStat(uri.toString()),
            this.labelService.getName(uri),
            this.labelService.getIcon(uri),
            this.getReadableTooltip(uri),
        ]).then(([stat, name, icon, title]) => ({
            name: stat ? name : name + (0, ide_core_browser_1.localize)('file.resource-deleted', '(已删除)'),
            icon,
            uri,
            metadata: null,
            deleted: !stat,
            supportsRevive: true,
            title,
        }));
    }
    provideResourceSubname(resource, groupResources) {
        const shouldDiff = [];
        for (const res of groupResources) {
            if (this.fileServiceClient.handlesScheme(res.uri.scheme) &&
                res.uri.displayName === resource.uri.displayName &&
                res !== resource) {
                // 存在file协议的相同名称的文件
                shouldDiff.push(res.uri);
            }
        }
        if (shouldDiff.length > 0) {
            const tail = getMinimalDiffPath(resource.uri, shouldDiff);
            if (tail.startsWith(Path.separator)) {
                // 说明当前为全路径
                if (tail.length > FileSystemResourceProvider_1.SUBNAME_LIMIT) {
                    return '...' + tail.slice(tail.length - FileSystemResourceProvider_1.SUBNAME_LIMIT);
                }
                else {
                    return tail;
                }
            }
            else {
                return '...' + Path.separator + getMinimalDiffPath(resource.uri, shouldDiff);
            }
        }
        else {
            return null;
        }
    }
    onDisposeResource(resource) {
        var _a;
        (_a = this.involvedFiles) === null || _a === void 0 ? void 0 : _a.delete(resource.uri.codeUri.fsPath);
        this.cachedFileStat.delete(resource.uri.toString());
    }
    async shouldCloseResourceWithoutConfirm(resource) {
        const documentModelRef = this.documentModelService.getModelReference(resource.uri, 'close-resource-check');
        if (documentModelRef && documentModelRef.instance.dirty) {
            return true;
        }
        return false;
    }
    async close(resource, saveAction) {
        const documentModelRef = this.documentModelService.getModelReference(resource.uri, 'close-resource-check');
        if (!documentModelRef) {
            return false;
        }
        if (saveAction === common_2.AskSaveResult.SAVE) {
            const res = await documentModelRef.instance.save();
            documentModelRef.dispose();
            return res;
        }
        else if (saveAction === common_2.AskSaveResult.REVERT) {
            await documentModelRef.instance.revert();
            documentModelRef.dispose();
            return true;
        }
        else if (!saveAction || saveAction === common_2.AskSaveResult.CANCEL) {
            documentModelRef.dispose();
            return false;
        }
        else {
            return true;
        }
    }
    async shouldCloseResource(resource, openedResources) {
        let count = 0;
        for (const resources of openedResources) {
            for (const r of resources) {
                if (r.uri.scheme === common_3.DIFF_SCHEME && r.metadata && r.metadata.modified.toString() === resource.uri.toString()) {
                    count++;
                }
                if (this.fileServiceClient.handlesScheme(r.uri.scheme) && r.uri.toString() === resource.uri.toString()) {
                    count++;
                }
                if (count > 1) {
                    return true;
                }
            }
        }
        const documentModelRef = this.documentModelService.getModelReference(resource.uri, 'close-resource-check');
        if (!documentModelRef || !documentModelRef.instance.dirty) {
            if (documentModelRef) {
                documentModelRef.dispose();
            }
            return true;
        }
        // 询问用户是否保存
        const buttons = {
            [(0, ide_core_browser_1.localize)('file.prompt.dontSave', "Don't Save")]: common_2.AskSaveResult.REVERT,
            [(0, ide_core_browser_1.localize)('file.prompt.save', 'Save')]: common_2.AskSaveResult.SAVE,
            [(0, ide_core_browser_1.localize)('file.prompt.cancel', 'Cancel')]: common_2.AskSaveResult.CANCEL,
        };
        const selection = await this.dialogService.open((0, ide_core_browser_1.formatLocalize)('saveChangesMessage', resource.name), ide_core_browser_1.MessageType.Info, Object.keys(buttons));
        const result = buttons[selection];
        return this.close(resource, result);
    }
};
FileSystemResourceProvider.SUBNAME_LIMIT = 20;
tslib_1.__decorate([
    (0, di_1.Autowired)(),
    tslib_1.__metadata("design:type", services_1.LabelService)
], FileSystemResourceProvider.prototype, "labelService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(common_1.IFileServiceClient),
    tslib_1.__metadata("design:type", Object)
], FileSystemResourceProvider.prototype, "fileServiceClient", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_overlay_1.IDialogService),
    tslib_1.__metadata("design:type", Object)
], FileSystemResourceProvider.prototype, "dialogService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(types_1.IEditorDocumentModelService),
    tslib_1.__metadata("design:type", Object)
], FileSystemResourceProvider.prototype, "documentModelService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.IApplicationService),
    tslib_1.__metadata("design:type", Object)
], FileSystemResourceProvider.prototype, "applicationService", void 0);
FileSystemResourceProvider = FileSystemResourceProvider_1 = tslib_1.__decorate([
    (0, di_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [])
], FileSystemResourceProvider);
exports.FileSystemResourceProvider = FileSystemResourceProvider;
/**
 * 找到 source 文件 url 和中从末尾开始和 target 不一样的 path
 * @param source
 * @param targets
 */
function getMinimalDiffPath(source, targets) {
    const sourceDirPartsReverse = source.path.dir.toString().split(Path.separator).reverse();
    const targetDirPartsReverses = targets.map((target) => target.path.dir.toString().split(Path.separator).reverse());
    for (let i = 0; i < sourceDirPartsReverse.length; i++) {
        let foundSame = false;
        for (const targetDirPartsReverse of targetDirPartsReverses) {
            if (targetDirPartsReverse[i] === sourceDirPartsReverse[i]) {
                foundSame = true;
                break;
            }
        }
        if (!foundSame) {
            return sourceDirPartsReverse
                .slice(0, i + 1)
                .reverse()
                .join(Path.separator);
        }
    }
    return sourceDirPartsReverse.reverse().join(Path.separator);
}
//# sourceMappingURL=fs-resource.js.map