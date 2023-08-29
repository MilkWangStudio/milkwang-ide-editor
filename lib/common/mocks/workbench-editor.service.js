"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockWorkbenchEditorService = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_common_1 = require("@opensumi/ide-core-common");
const editor_1 = require("../editor");
let MockWorkbenchEditorService = class MockWorkbenchEditorService extends editor_1.WorkbenchEditorService {
    constructor() {
        super(...arguments);
        this._onActiveResourceChange = new ide_core_common_1.Emitter();
        this.onActiveResourceChange = this._onActiveResourceChange.event;
        this._onDidEditorGroupsChanged = new ide_core_common_1.Emitter();
        this.onDidEditorGroupsChanged = this._onDidEditorGroupsChanged.event;
        this._onDidCurrentEditorGroupChanged = new ide_core_common_1.Emitter();
        this.onDidCurrentEditorGroupChanged = this._onDidCurrentEditorGroupChanged.event;
    }
    async closeAll(uri, force) {
        throw new Error('Method not implemented.');
    }
    async open(uri, options) {
        throw new Error('Method not implemented.');
    }
    async openUris(uri) {
        throw new Error('Method not implemented.');
    }
    saveAll(includeUntitled) {
        throw new Error('Method not implemented.');
    }
    async close(uri, force) {
        throw new Error('Method not implemented.');
    }
    getAllOpenedUris() {
        throw new Error('Method not implemented.');
    }
    // 创建一个带待存的资源
    createUntitledResource(options) {
        throw new Error('Method not implemented.');
    }
    setEditorContextKeyService() {
        throw new Error('Method not implemented.');
    }
    calcDirtyCount() {
        return 0;
    }
};
MockWorkbenchEditorService = tslib_1.__decorate([
    (0, di_1.Injectable)()
], MockWorkbenchEditorService);
exports.MockWorkbenchEditorService = MockWorkbenchEditorService;
//# sourceMappingURL=workbench-editor.service.js.map