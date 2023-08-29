"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaveTask = void 0;
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
class SaveTask extends ide_core_browser_1.Disposable {
    constructor(uri, versionId, alternativeVersionId, content, ignoreDiff) {
        super();
        this.uri = uri;
        this.versionId = versionId;
        this.alternativeVersionId = alternativeVersionId;
        this.content = content;
        this.ignoreDiff = ignoreDiff;
        this.deferred = new ide_core_browser_1.Deferred();
        this.finished = this.deferred.promise;
        this.started = false;
        this.disposables.push((this.cancelToken = new ide_core_browser_1.CancellationTokenSource()));
    }
    async run(service, baseContent, changes, encoding, eol) {
        this.started = true;
        try {
            const res = await service.saveEditorDocumentModel(this.uri, this.content, baseContent, changes, encoding, this.ignoreDiff, eol, this.cancelToken.token);
            this.deferred.resolve(res);
            return res;
        }
        catch (e) {
            const res = {
                errorMessage: e.message,
                state: ide_core_browser_1.SaveTaskResponseState.ERROR,
            };
            this.deferred.resolve(res);
            return res;
        }
    }
    cancel() {
        this.cancelToken.cancel();
        const res = {
            errorMessage: "cancel" /* SaveTaskErrorCause.CANCEL */,
            state: ide_core_browser_1.SaveTaskResponseState.ERROR,
        };
        this.deferred.resolve(res);
    }
}
exports.SaveTask = SaveTask;
//# sourceMappingURL=save-task.js.map