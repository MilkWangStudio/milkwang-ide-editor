"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorOpener = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const common_1 = require("../common");
let EditorOpener = class EditorOpener {
    async open(uri) {
        let range;
        const match = /^L?(\d+)(?:,(\d+))?/.exec(uri.fragment);
        if (match) {
            // support file:///some/file.js#73,84
            // support file:///some/file.js#L73
            const startLineNumber = parseInt(match[1], 10);
            const startColumn = match[2] ? parseInt(match[2], 10) : 1;
            range = {
                startLineNumber,
                startColumn,
                endLineNumber: startLineNumber,
                endColumn: startColumn,
            };
            // remove fragment
            uri = uri.withFragment('');
        }
        await this.workbenchEditorService.open(uri, {
            range,
        });
        return true;
    }
    async handleURI(uri) {
        // 判断编辑器是否可以打开
        return this.resourceService.handlesUri(uri);
    }
    handleScheme() {
        // 使用 handleURI 后会忽略 handleScheme
        return false;
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(common_1.ResourceService),
    tslib_1.__metadata("design:type", common_1.ResourceService)
], EditorOpener.prototype, "resourceService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(common_1.WorkbenchEditorService),
    tslib_1.__metadata("design:type", common_1.WorkbenchEditorService)
], EditorOpener.prototype, "workbenchEditorService", void 0);
EditorOpener = tslib_1.__decorate([
    (0, di_1.Injectable)()
], EditorOpener);
exports.EditorOpener = EditorOpener;
//# sourceMappingURL=editor-opener.js.map