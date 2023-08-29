"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageService = exports.reviveMarker = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_common_1 = require("@opensumi/ide-core-common");
const tokenizer_1 = require("@opensumi/ide-monaco/lib/browser/contrib/tokenizer");
const common_1 = require("../../common");
const diagnostic_collection_1 = require("./diagnostic-collection");
function reviveSeverity(severity) {
    switch (severity) {
        case ide_core_common_1.MarkerSeverity.Error:
            return common_1.DiagnosticSeverity.Error;
        case ide_core_common_1.MarkerSeverity.Warning:
            return common_1.DiagnosticSeverity.Warning;
        case ide_core_common_1.MarkerSeverity.Info:
            return common_1.DiagnosticSeverity.Information;
        case ide_core_common_1.MarkerSeverity.Hint:
            return common_1.DiagnosticSeverity.Hint;
    }
}
function reviveRange(startLine, startColumn, endLine, endColumn) {
    // note: language server range is 0-based, marker is 1-based, so need to deduct 1 here
    return {
        start: {
            line: startLine - 1,
            character: startColumn - 1,
        },
        end: {
            line: endLine - 1,
            character: endColumn - 1,
        },
    };
}
function reviveRelated(related) {
    return {
        message: related.message,
        location: {
            uri: related.resource,
            range: reviveRange(related.startLineNumber, related.startColumn, related.endLineNumber, related.endColumn),
        },
    };
}
function reviveMarker(marker) {
    const monacoMarker = {
        code: typeof marker.codeHref !== 'undefined'
            ? {
                value: String(marker.code),
                target: marker.codeHref.codeUri,
            }
            : marker.code,
        severity: reviveSeverity(marker.severity),
        range: reviveRange(marker.startLineNumber, marker.startColumn, marker.endLineNumber, marker.endColumn),
        message: marker.message,
        source: marker.source,
        relatedInformation: undefined,
        tags: marker.tags,
    };
    if (marker.relatedInformation) {
        monacoMarker.relatedInformation = marker.relatedInformation.map(reviveRelated);
    }
    return monacoMarker;
}
exports.reviveMarker = reviveMarker;
let LanguageService = class LanguageService {
    constructor() {
        this.markers = new Map();
        this.workspaceSymbolProviders = [];
        for (const uri of this.markerManager.getResources()) {
            this.updateMarkers(new ide_core_common_1.URI(uri));
        }
        this.markerManager.onMarkerChanged((uris) => {
            if (uris) {
                uris.forEach((uri) => this.updateMarkers(new ide_core_common_1.URI(uri)));
            }
        });
    }
    get languages() {
        return [...this.mergeLanguages(this.textmateService.getLanguages()).values()];
    }
    getLanguage(languageId) {
        return this.mergeLanguages(this.textmateService.getLanguages().filter((language) => language.id === languageId)).get(languageId);
    }
    mergeLanguages(registered) {
        const languages = new Map();
        for (const { id, aliases, extensions, filenames } of registered) {
            const merged = languages.get(id) || {
                id,
                name: '',
                extensions: new Set(),
                filenames: new Set(),
            };
            if (!merged.name && aliases && aliases.length) {
                merged.name = aliases[0];
            }
            if (extensions && extensions.length) {
                for (const extension of extensions) {
                    merged.extensions.add(extension);
                }
            }
            if (filenames && filenames.length) {
                for (const filename of filenames) {
                    merged.filenames.add(filename);
                }
            }
            languages.set(id, merged);
        }
        for (const [id, language] of languages) {
            if (!language.name) {
                language.name = id;
            }
        }
        return languages;
    }
    registerWorkspaceSymbolProvider(provider) {
        this.workspaceSymbolProviders.push(provider);
        return ide_core_common_1.Disposable.create(() => {
            const index = this.workspaceSymbolProviders.indexOf(provider);
            if (index !== -1) {
                this.workspaceSymbolProviders.splice(index, 1);
            }
        });
    }
    updateMarkers(uri) {
        const uriString = uri.toString();
        const owners = new Map();
        for (const marker of this.markerManager.getMarkers({ resource: uri.toString() })) {
            const diagnostics = owners.get(marker.type) || [];
            diagnostics.push(reviveMarker(marker));
            owners.set(marker.type, diagnostics);
        }
        const toClean = new Set(this.markers.keys());
        for (const [owner, diagnostics] of owners) {
            toClean.delete(owner);
            const collection = this.markers.get(owner) || new diagnostic_collection_1.MonacoDiagnosticCollection(owner);
            collection.set(uriString, diagnostics);
            this.markers.set(owner, collection);
        }
        for (const owner of toClean) {
            const collection = this.markers.get(owner);
            if (collection) {
                collection.set(uriString, []);
            }
        }
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(),
    tslib_1.__metadata("design:type", ide_core_common_1.MarkerManager)
], LanguageService.prototype, "markerManager", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(tokenizer_1.ITextmateTokenizer),
    tslib_1.__metadata("design:type", Object)
], LanguageService.prototype, "textmateService", void 0);
LanguageService = tslib_1.__decorate([
    (0, di_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [])
], LanguageService);
exports.LanguageService = LanguageService;
//# sourceMappingURL=language.service.js.map