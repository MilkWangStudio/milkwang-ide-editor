"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseFileSystemEditorDocumentProvider = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const ide_file_service_1 = require("@opensumi/ide-file-service");
const schema_1 = require("../preference/schema");
/**
 * 通用的用来处理 FileSystem 提供的文档
 * 可以 extend 这个来添加更强的能力，如 file-scheme 中的 file-doc
 */
let BaseFileSystemEditorDocumentProvider = class BaseFileSystemEditorDocumentProvider {
    constructor() {
        this._onDidChangeContent = new ide_core_browser_1.Emitter();
        this.onDidChangeContent = this._onDidChangeContent.event;
        this._fileContentMd5OnBrowserFs = new Set();
        this._detectedEncodingMap = new Map();
        this.fileServiceClient.onFilesChanged((changes) => {
            changes.forEach((change) => {
                if (this._fileContentMd5OnBrowserFs.has(change.uri)) {
                    if (change.type === ide_core_browser_1.FileChangeType.ADDED || change.type === ide_core_browser_1.FileChangeType.UPDATED) {
                        this._onDidChangeContent.fire(new ide_core_browser_1.URI(change.uri));
                    }
                }
            });
        });
    }
    handlesScheme(scheme) {
        return this.fileServiceClient.handlesScheme(scheme);
    }
    provideEncoding(uri) {
        return this._detectedEncodingMap.get(uri.toString()) || ide_core_browser_1.UTF8;
    }
    async provideEOL(uri) {
        const backendOS = await this.applicationService.getBackendOS();
        const eol = this.preferenceService.get('files.eol', 'auto', uri.toString(), (0, ide_core_browser_1.getLanguageIdFromMonaco)(uri));
        if (eol !== 'auto') {
            return eol;
        }
        return backendOS === ide_core_browser_1.OperatingSystem.Windows ? "\r\n" /* EOL.CRLF */ : "\n" /* EOL.LF */;
    }
    async read(uri, options) {
        const { content: buffer } = await this.fileServiceClient.readFile(uri.toString());
        const guessEncoding = options.autoGuessEncoding ||
            this.preferenceService.get('files.autoGuessEncoding', undefined, uri.toString(), (0, ide_core_browser_1.getLanguageIdFromMonaco)(uri));
        const detected = await (0, ide_core_browser_1.detectEncodingFromBuffer)(buffer, guessEncoding);
        detected.encoding = await this.getReadEncoding(uri, options, detected.encoding);
        const content = buffer.toString(detected.encoding);
        const uriString = uri.toString();
        this._detectedEncodingMap.set(uriString, detected.encoding);
        // 记录表示这个文档被[这个editorDocumentProvider]引用了
        this._fileContentMd5OnBrowserFs.add(uriString);
        return {
            encoding: detected.encoding || ide_core_browser_1.UTF8,
            content,
        };
    }
    async provideEditorDocumentModelContent(uri, encoding) {
        // TODO: 这部分要优化成buffer获取（长期来看是stream获取，encoding在哪一层做？）
        // 暂时还是使用 resolveContent 内提供的 decode 功能
        // 之后 encoding 做了分层之后和其他的需要 decode 的地方一起改
        return (await this.read(uri, { encoding })).content;
    }
    async isReadonly(uri) {
        const readonlyFiles = this.editorPreferences['editor.readonlyFiles'];
        if (readonlyFiles && readonlyFiles.length) {
            for (const file of readonlyFiles) {
                if (uri.isEqual(ide_core_browser_1.URI.file(file)) ||
                    uri.matchGlobPattern(file) ||
                    uri.toString().endsWith(file.replace('./', ''))) {
                    return true;
                }
            }
        }
        return this.fileServiceClient.isReadonly(uri.toString());
    }
    async saveDocumentModel(uri, content, baseContent, changes, encoding, ignoreDiff = false) {
        // 默认的文件系统都直接存 content
        try {
            const fileStat = await this.fileServiceClient.getFileStat(uri.toString());
            if (!fileStat) {
                await this.fileServiceClient.createFile(uri.toString(), { content, overwrite: true, encoding });
            }
            else {
                await this.fileServiceClient.setContent(fileStat, content, { encoding });
            }
            return {
                state: ide_core_browser_1.SaveTaskResponseState.SUCCESS,
            };
        }
        catch (e) {
            return {
                state: ide_core_browser_1.SaveTaskResponseState.ERROR,
                errorMessage: e.message,
            };
        }
    }
    onDidDisposeModel(uri) {
        this._fileContentMd5OnBrowserFs.delete(uri.toString());
    }
    async guessEncoding(uri) {
        return (await this.read(uri, { autoGuessEncoding: true })).encoding;
    }
    getReadEncoding(resource, options, detectedEncoding) {
        let preferredEncoding;
        // Encoding passed in as option
        if (options === null || options === void 0 ? void 0 : options.encoding) {
            if (detectedEncoding === ide_core_browser_1.UTF8_with_bom && options.encoding === ide_core_browser_1.UTF8) {
                preferredEncoding = ide_core_browser_1.UTF8_with_bom; // indicate the file has BOM if we are to resolve with UTF 8
            }
            else {
                preferredEncoding = options.encoding; // give passed in encoding highest priority
            }
        }
        else if (detectedEncoding) {
            preferredEncoding = detectedEncoding;
        }
        return this.getEncodingForResource(resource, preferredEncoding);
    }
    async getEncodingForResource(resource, preferredEncoding) {
        return this.encodingRegistry.getEncodingForResource(resource, preferredEncoding);
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_file_service_1.IFileServiceClient),
    tslib_1.__metadata("design:type", Object)
], BaseFileSystemEditorDocumentProvider.prototype, "fileServiceClient", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(schema_1.EditorPreferences),
    tslib_1.__metadata("design:type", Object)
], BaseFileSystemEditorDocumentProvider.prototype, "editorPreferences", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.IApplicationService),
    tslib_1.__metadata("design:type", Object)
], BaseFileSystemEditorDocumentProvider.prototype, "applicationService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.PreferenceService),
    tslib_1.__metadata("design:type", Object)
], BaseFileSystemEditorDocumentProvider.prototype, "preferenceService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.EncodingRegistry),
    tslib_1.__metadata("design:type", ide_core_browser_1.EncodingRegistry)
], BaseFileSystemEditorDocumentProvider.prototype, "encodingRegistry", void 0);
BaseFileSystemEditorDocumentProvider = tslib_1.__decorate([
    (0, di_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [])
], BaseFileSystemEditorDocumentProvider);
exports.BaseFileSystemEditorDocumentProvider = BaseFileSystemEditorDocumentProvider;
//# sourceMappingURL=fs-editor-doc.js.map