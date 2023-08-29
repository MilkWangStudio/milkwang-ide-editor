"use strict";
var EditorDocumentModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorDocumentModel = void 0;
const tslib_1 = require("tslib");
const debounce_1 = tslib_1.__importDefault(require("lodash/debounce"));
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const hash_calculate_1 = require("@opensumi/ide-core-common/lib/hash-calculate/hash-calculate");
const monaco_api_1 = require("@opensumi/ide-monaco/lib/browser/monaco-api");
const types_1 = require("@opensumi/ide-monaco/lib/browser/monaco-api/types");
const ide_overlay_1 = require("@opensumi/ide-overlay");
const editOperation_1 = require("@opensumi/monaco-editor-core/esm/vs/editor/common/core/editOperation");
const range_1 = require("@opensumi/monaco-editor-core/esm/vs/editor/common/core/range");
const model_1 = require("@opensumi/monaco-editor-core/esm/vs/editor/common/model");
const textModel_1 = require("@opensumi/monaco-editor-core/esm/vs/editor/common/model/textModel");
const common_1 = require("../../common");
const util_1 = require("../preference/util");
const types_2 = require("../types");
const editor_document_error_1 = require("./editor-document-error");
const save_task_1 = require("./save-task");
const types_3 = require("./types");
let EditorDocumentModel = EditorDocumentModel_1 = class EditorDocumentModel extends ide_core_browser_1.Disposable {
    constructor(uri, content, options = {}) {
        super();
        this.uri = uri;
        this.saveQueue = new ide_core_browser_1.Throttler();
        this._encoding = 'utf8';
        this.readonly = false;
        this.savable = false;
        this.alwaysDirty = false;
        this.closeAutoSave = false;
        this.disposeEvenDirty = false;
        this._originalEncoding = this._encoding;
        this._persistVersionId = 0;
        this._baseContent = '';
        this.savingTasks = [];
        this.dirtyChanges = [];
        this._isInitOption = true;
        this._onDidChangeEncoding = new ide_core_browser_1.Emitter();
        this.onDidChangeEncoding = this._onDidChangeEncoding.event;
        this.onDispose(() => {
            this.eventBus.fire(new types_3.EditorDocumentModelRemovalEvent(this.uri));
        });
        if (options.encoding) {
            this._encoding = options.encoding;
        }
        this.readonly = !!options.readonly;
        this.savable = !!options.savable;
        this.alwaysDirty = !!options.alwaysDirty;
        this.disposeEvenDirty = !!options.disposeEvenDirty;
        this.closeAutoSave = !!options.closeAutoSave;
        this.monacoModel = monaco_api_1.monaco.editor.createModel(content, options.languageId, monaco_api_1.URI.parse(uri.toString()));
        this.editorPreferences = (0, util_1.createEditorPreferenceProxy)(this.preferences, this.uri.toString(), this.languageId);
        this.updateOptions({});
        if (options.eol) {
            this.eol = options.eol;
        }
        this._originalEncoding = this._encoding;
        this._previousVersionId = this.monacoModel.getVersionId();
        this._persistVersionId = this.monacoModel.getAlternativeVersionId();
        this.baseContent = content;
        this._isInitOption = false;
        this.listenTo(this.monacoModel);
        this.readCacheToApply();
        this.addDispose(this._onDidChangeEncoding);
        this.addDispose(this.monacoModel.onDidChangeLanguage((e) => {
            this.eventBus.fire(new types_3.EditorDocumentModelOptionChangedEvent({
                uri: this.uri,
                languageId: e.newLanguage,
            }));
        }));
    }
    updateOptions(options) {
        const finalOptions = Object.assign({ tabSize: this.editorPreferences['editor.tabSize'] || 1, insertSpaces: this.editorPreferences['editor.insertSpaces'], detectIndentation: this.editorPreferences['editor.detectIndentation'] }, options);
        if (finalOptions.detectIndentation) {
            this.monacoModel.detectIndentation(finalOptions.insertSpaces, finalOptions.tabSize);
        }
        else {
            this.monacoModel.updateOptions(finalOptions);
        }
    }
    listenTo(monacoModel) {
        this.addDispose(monacoModel.onDidChangeContent((e) => {
            if (e.changes && e.changes.length > 0) {
                this.dirtyChanges.push({
                    fromVersionId: this._previousVersionId,
                    toVersionId: e.versionId,
                    changes: e.changes,
                });
            }
            this._previousVersionId = e.versionId;
            this.notifyChangeEvent(e.changes, e.isRedoing, e.isUndoing);
        }));
        this.addDispose(monacoModel);
    }
    readCacheToApply() {
        if (!this.cacheProvider.hasCache(this.uri)) {
            return;
        }
        const maybePromiseCache = this.cacheProvider.getCache(this.uri, this.encoding);
        if (maybePromiseCache) {
            if ((0, ide_core_browser_1.isThenable)(maybePromiseCache)) {
                maybePromiseCache
                    .then((cache) => {
                    if (cache) {
                        this.applyCache(cache);
                    }
                })
                    .catch((err) => {
                    this.logger.error(`${editor_document_error_1.EditorDocumentError.READ_CACHE_ERROR} ${err && err.message}`);
                });
            }
            else {
                this.applyCache(maybePromiseCache);
            }
        }
    }
    applyCache(cache) {
        if (this.dirty) {
            this.logger.error(editor_document_error_1.EditorDocumentError.APPLY_CACHE_TO_DIRTY_DOCUMENT);
            return;
        }
        if (this.baseContentMd5 !== cache.startMD5) {
            this.logger.error(editor_document_error_1.EditorDocumentError.APPLY_CACHE_TO_DIFFERENT_DOCUMENT);
            return;
        }
        if ((0, common_1.isDocContentCache)(cache)) {
            this.monacoModel.setValue(cache.content);
        }
        else {
            for (const changes of cache.changeMatrix) {
                const operations = changes.map((change) => ({
                    range: (0, common_1.parseRangeFrom)(change),
                    text: change[0],
                }));
                this.monacoModel.applyEdits(operations);
            }
        }
    }
    cleanAndUpdateContent(content) {
        this.monacoModel.setValue(content);
        this.monacoModel._commandManager.clear();
        this._persistVersionId = this.monacoModel.getAlternativeVersionId();
        this.savingTasks = [];
        this.notifyChangeEvent([], false, false);
        this.baseContent = content;
    }
    async updateEncoding(encoding) {
        let shouldFireChange = false;
        if (this._encoding !== encoding) {
            shouldFireChange = true;
        }
        this._encoding = encoding;
        await this.reload();
        if (shouldFireChange) {
            this.eventBus.fire(new types_3.EditorDocumentModelOptionChangedEvent({
                uri: this.uri,
                encoding: this._encoding,
            }));
            this._onDidChangeEncoding.fire();
        }
    }
    get encoding() {
        return this._encoding;
    }
    set eol(eol) {
        this.monacoModel.setEOL(eol === "\n" /* EOL.LF */ ? types_1.EndOfLineSequence.LF : types_1.EndOfLineSequence.CRLF);
        if (!this._isInitOption) {
            this.eventBus.fire(new types_3.EditorDocumentModelOptionChangedEvent({
                uri: this.uri,
                eol,
            }));
        }
    }
    get eol() {
        return this.monacoModel.getEOL();
    }
    get dirty() {
        if (this.alwaysDirty) {
            return true;
        }
        if (!this.savable) {
            return false;
        }
        if (this.monacoModel.isDisposed()) {
            return false;
        }
        return this._persistVersionId !== this.monacoModel.getAlternativeVersionId();
    }
    set languageId(languageId) {
        monaco_api_1.monaco.editor.setModelLanguage(this.monacoModel, languageId);
        this.eventBus.fire(new types_3.EditorDocumentModelOptionChangedEvent({
            uri: this.uri,
            languageId,
        }));
    }
    get languageId() {
        return this.monacoModel.getLanguageId();
    }
    get id() {
        return this.monacoModel.id;
    }
    getMonacoModel() {
        return this.monacoModel;
    }
    async save(force = false, reason = common_1.SaveReason.Manual) {
        const doSave = async (force = false, reason = common_1.SaveReason.Manual) => {
            await this.formatOnSave(reason);
            // 发送willSave并等待完成
            await this.eventBus.fireAndAwait(new types_3.EditorDocumentModelWillSaveEvent({
                uri: this.uri,
                reason,
                language: this.languageId,
            }));
            if (!this.editorPreferences['editor.askIfDiff']) {
                force = true;
            }
            if (!this.dirty) {
                return false;
            }
            const versionId = this.monacoModel.getVersionId();
            const lastSavingTask = this.savingTasks[this.savingTasks.length - 1];
            if (lastSavingTask && lastSavingTask.versionId === versionId) {
                lastSavingTask.cancel();
                const task = this.savingTasks.pop();
                task === null || task === void 0 ? void 0 : task.dispose();
            }
            const task = new save_task_1.SaveTask(this.uri, versionId, this.monacoModel.getAlternativeVersionId(), this.getText(), force);
            this.savingTasks.push(task);
            if (this.savingTasks.length > 0) {
                this.initSave();
            }
            const res = await task.finished;
            if (res.state === ide_core_browser_1.SaveTaskResponseState.SUCCESS) {
                this.monacoModel.pushStackElement();
                return true;
            }
            else if (res.state === ide_core_browser_1.SaveTaskResponseState.ERROR) {
                if (res.errorMessage !== "cancel" /* SaveTaskErrorCause.CANCEL */) {
                    this.logger.error(res.errorMessage);
                    this.messageService.error((0, ide_core_browser_1.localize)('doc.saveError.failed') + '\n' + res.errorMessage);
                }
                return false;
            }
            else if (res.state === ide_core_browser_1.SaveTaskResponseState.DIFF) {
                const diffAndSave = (0, ide_core_browser_1.localize)('doc.saveError.diffAndSave');
                const overwrite = (0, ide_core_browser_1.localize)('doc.saveError.overwrite');
                this.messageService
                    .error((0, ide_core_browser_1.formatLocalize)('doc.saveError.diff', this.uri.toString()), [diffAndSave, overwrite])
                    .then((res) => {
                    if (res === diffAndSave) {
                        this.compareAndSave();
                    }
                    else if (res === overwrite) {
                        doSave(true, reason);
                    }
                });
                this.logger.error('The file cannot be saved, the version is inconsistent with the disk');
                return false;
            }
            return false;
        };
        return this.saveQueue.queue(doSave.bind(this, force, reason));
    }
    async compareAndSave() {
        const originalUri = ide_core_browser_1.URI.from({
            scheme: types_3.ORIGINAL_DOC_SCHEME,
            query: ide_core_browser_1.URI.stringifyQuery({
                target: this.uri.toString(),
            }),
        });
        const fileName = this.uri.path.base;
        const res = await this.compareService.compare(originalUri, this.uri, (0, ide_core_browser_1.formatLocalize)('editor.compareAndSave.title', fileName, fileName));
        if (res === types_2.CompareResult.revert) {
            this.revert();
        }
        else if (res === types_2.CompareResult.accept) {
            this.save(true);
        }
    }
    async initSave() {
        while (this.savingTasks.length > 0) {
            const changes = this.dirtyChanges;
            this.dirtyChanges = [];
            const res = await this.savingTasks[0].run(this.service, this.baseContent, changes, this.encoding, this.eol);
            if (res.state === 'success' && this.savingTasks[0]) {
                this.baseContent = this.savingTasks[0].content;
                this.eventBus.fire(new types_3.EditorDocumentModelSavedEvent(this.uri));
                this.setPersist(this.savingTasks[0].alternativeVersionId);
            }
            else {
                // 回滚 changes
                this.dirtyChanges.unshift(...changes);
            }
            this.savingTasks.shift();
        }
    }
    setPersist(versionId) {
        this._persistVersionId = versionId;
        this.notifyChangeEvent([], false, false);
    }
    async reload() {
        try {
            const content = await this.contentRegistry.getContentForUri(this.uri, this._encoding);
            if (!(0, ide_core_browser_1.isUndefinedOrNull)(content)) {
                this.cleanAndUpdateContent(content);
            }
        }
        catch (e) {
            this._persistVersionId = this.monacoModel.getAlternativeVersionId();
        }
    }
    async revert(notOnDisk) {
        if (notOnDisk) {
            // FIXME: 暂时就让它不 dirty, 不是真正的 revert
            this._persistVersionId = this.monacoModel.getAlternativeVersionId();
        }
        else {
            // 利用修改编码的副作用
            await this.updateEncoding(this._originalEncoding);
        }
    }
    getText(range) {
        if (range) {
            return this.monacoModel.getValueInRange(range);
        }
        else {
            return this.monacoModel.getValue();
        }
    }
    updateContent(content, eol, setPersist = false) {
        if (eol) {
            this.eol = eol;
        }
        const defaultEOL = this.eol === "\r\n" /* EOL.CRLF */ ? model_1.DefaultEndOfLine.CRLF : model_1.DefaultEndOfLine.LF;
        const { textBuffer, disposable } = (0, textModel_1.createTextBuffer)(content, defaultEOL);
        // 计算新旧 Monaco 文档的差异，避免全量更新导致的高亮闪烁问题
        const singleEditOperation = EditorDocumentModel_1._computeEdits(this.monacoModel, textBuffer);
        this.monacoModel.pushEditOperations([], singleEditOperation, () => []);
        if (setPersist) {
            this.setPersist(this.monacoModel.getAlternativeVersionId());
            this.baseContent = content;
            this.dirtyChanges = [];
        }
        disposable.dispose();
    }
    /**
     * Compute edits to bring `model` to the state of `textSource`.
     */
    static _computeEdits(model, textBuffer) {
        const modelLineCount = model.getLineCount();
        const textBufferLineCount = textBuffer.getLineCount();
        const commonPrefix = this._commonPrefix(model, modelLineCount, 1, textBuffer, textBufferLineCount, 1);
        if (modelLineCount === textBufferLineCount && commonPrefix === modelLineCount) {
            // equality case
            return [];
        }
        const commonSuffix = this._commonSuffix(model, modelLineCount - commonPrefix, commonPrefix, textBuffer, textBufferLineCount - commonPrefix, commonPrefix);
        let oldRange;
        let newRange;
        if (commonSuffix > 0) {
            oldRange = new range_1.Range(commonPrefix + 1, 1, modelLineCount - commonSuffix + 1, 1);
            newRange = new range_1.Range(commonPrefix + 1, 1, textBufferLineCount - commonSuffix + 1, 1);
        }
        else if (commonPrefix > 0) {
            oldRange = new range_1.Range(commonPrefix, model.getLineMaxColumn(commonPrefix), modelLineCount, model.getLineMaxColumn(modelLineCount));
            newRange = new range_1.Range(commonPrefix, 1 + textBuffer.getLineLength(commonPrefix), textBufferLineCount, 1 + textBuffer.getLineLength(textBufferLineCount));
        }
        else {
            oldRange = new range_1.Range(1, 1, modelLineCount, model.getLineMaxColumn(modelLineCount));
            newRange = new range_1.Range(1, 1, textBufferLineCount, 1 + textBuffer.getLineLength(textBufferLineCount));
        }
        return [editOperation_1.EditOperation.replaceMove(oldRange, textBuffer.getValueInRange(newRange, model_1.EndOfLinePreference.TextDefined))];
    }
    static _commonPrefix(a, aLen, aDelta, b, bLen, bDelta) {
        const maxResult = Math.min(aLen, bLen);
        let result = 0;
        for (let i = 0; i < maxResult && a.getLineContent(aDelta + i) === b.getLineContent(bDelta + i); i++) {
            result++;
        }
        return result;
    }
    static _commonSuffix(a, aLen, aDelta, b, bLen, bDelta) {
        const maxResult = Math.min(aLen, bLen);
        let result = 0;
        for (let i = 0; i < maxResult && a.getLineContent(aDelta + aLen - i) === b.getLineContent(bDelta + bLen - i); i++) {
            result++;
        }
        return result;
    }
    set baseContent(content) {
        this._baseContent = content;
        this._baseContentMd5 = null;
    }
    get baseContent() {
        return this._baseContent;
    }
    get baseContentMd5() {
        if (!this._baseContentMd5) {
            this._baseContentMd5 = this.hashCalculateService.calculate(this._baseContent);
        }
        return this._baseContentMd5;
    }
    get tryAutoSaveAfterDelay() {
        if (!this._tryAutoSaveAfterDelay) {
            this._tryAutoSaveAfterDelay = (0, debounce_1.default)(() => {
                this.save(undefined, common_1.SaveReason.AfterDelay);
            }, this.editorPreferences['editor.autoSaveDelay'] || 1000);
            this.addDispose(this.editorPreferences.onPreferenceChanged((change) => {
                if (change.preferenceName === 'editor.autoSaveDelay') {
                    this._tryAutoSaveAfterDelay = (0, debounce_1.default)(() => {
                        this.save(undefined, common_1.SaveReason.AfterDelay);
                    }, this.editorPreferences['editor.autoSaveDelay'] || 1000);
                }
            }));
        }
        return this._tryAutoSaveAfterDelay;
    }
    getBaseContentMd5() {
        if (!this._baseContentMd5) {
            this._baseContentMd5 = this.hashCalculateService.calculate(this._baseContent);
        }
        return this._baseContentMd5;
    }
    notifyChangeEvent(changes = [], isRedoing, isUndoing) {
        if (!this.closeAutoSave && this.savable && this.editorPreferences['editor.autoSave'] === 'afterDelay') {
            this.tryAutoSaveAfterDelay();
        }
        // 发出内容变化的事件
        this.eventBus.fire(new types_3.EditorDocumentModelContentChangedEvent({
            uri: this.uri,
            dirty: this.dirty,
            readonly: this.readonly,
            changes,
            eol: this.eol,
            isRedoing,
            isUndoing,
            versionId: this.monacoModel.getVersionId(),
        }));
        const self = this;
        this.cacheProvider.persistCache(this.uri, {
            // 使用 getter 让需要计算的数据变成 lazy 获取的
            get dirty() {
                return self.dirty;
            },
            get startMD5() {
                return self.getBaseContentMd5();
            },
            get content() {
                return self.getText();
            },
            get changeMatrix() {
                // 计算从起始版本到现在所有的 change 内容，然后让缓存对象进行持久化
                return self.dirtyChanges.map(({ changes }) => changes);
            },
            encoding: this.encoding,
        });
    }
    async formatOnSave(reason) {
        const formatOnSave = this.editorPreferences['editor.formatOnSave'];
        // 和 vscode 逻辑保持一致，如果是 AfterDelay 则不执行 formatOnSave
        if (formatOnSave && reason !== common_1.SaveReason.AfterDelay) {
            const formatOnSaveTimeout = this.editorPreferences['editor.formatOnSaveTimeout'] || 3000;
            const timer = this.reporter.time(ide_core_browser_1.REPORT_NAME.FORMAT_ON_SAVE);
            try {
                await Promise.race([
                    new Promise((_, reject) => {
                        setTimeout(() => {
                            const err = new Error((0, ide_core_browser_1.formatLocalize)('preference.editor.formatOnSaveTimeoutError', formatOnSaveTimeout));
                            err.name = 'FormatOnSaveTimeoutError';
                            reject(err);
                        }, formatOnSaveTimeout);
                    }),
                    this.commandService.executeCommand('editor.action.formatDocument'),
                ]);
            }
            catch (err) {
                if (err.name === 'FormatOnSaveTimeoutError') {
                    this.reporter.point(ide_core_browser_1.REPORT_NAME.FORMAT_ON_SAVE_TIMEOUT_ERROR, this.uri.toString());
                }
                // 目前 command 没有读取到 contextkey，在不支持 format 的地方执行 format 命令会报错，先警告下，后续要接入 contextkey 来判断
                this.logger.warn(`${editor_document_error_1.EditorDocumentError.FORMAT_ERROR} ${err && err.message}`);
            }
            finally {
                timer.timeEnd(this.uri.path.ext);
            }
        }
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(types_3.IEditorDocumentModelContentRegistry),
    tslib_1.__metadata("design:type", Object)
], EditorDocumentModel.prototype, "contentRegistry", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(types_3.IEditorDocumentModelService),
    tslib_1.__metadata("design:type", Object)
], EditorDocumentModel.prototype, "service", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(types_2.ICompareService),
    tslib_1.__metadata("design:type", Object)
], EditorDocumentModel.prototype, "compareService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(common_1.IDocPersistentCacheProvider),
    tslib_1.__metadata("design:type", Object)
], EditorDocumentModel.prototype, "cacheProvider", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_overlay_1.IMessageService),
    tslib_1.__metadata("design:type", Object)
], EditorDocumentModel.prototype, "messageService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.IEventBus),
    tslib_1.__metadata("design:type", Object)
], EditorDocumentModel.prototype, "eventBus", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.ILogger),
    tslib_1.__metadata("design:type", Object)
], EditorDocumentModel.prototype, "logger", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.CommandService),
    tslib_1.__metadata("design:type", Object)
], EditorDocumentModel.prototype, "commandService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.IReporterService),
    tslib_1.__metadata("design:type", Object)
], EditorDocumentModel.prototype, "reporter", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.PreferenceService),
    tslib_1.__metadata("design:type", Object)
], EditorDocumentModel.prototype, "preferences", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(hash_calculate_1.IHashCalculateService),
    tslib_1.__metadata("design:type", Object)
], EditorDocumentModel.prototype, "hashCalculateService", void 0);
EditorDocumentModel = EditorDocumentModel_1 = tslib_1.__decorate([
    (0, di_1.Injectable)({ multiple: true }),
    tslib_1.__metadata("design:paramtypes", [ide_core_browser_1.URI, String, Object])
], EditorDocumentModel);
exports.EditorDocumentModel = EditorDocumentModel;
//# sourceMappingURL=editor-document-model.js.map