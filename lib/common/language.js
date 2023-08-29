"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asMonacoDiagnostic = exports.asMonacoDiagnostics = exports.asRelatedInformation = exports.asRelatedInformations = exports.asSeverity = exports.DiagnosticTag = exports.DiagnosticSeverity = exports.ILanguageService = void 0;
const ide_core_common_1 = require("@opensumi/ide-core-common");
const uri_1 = require("@opensumi/monaco-editor-core/esm/vs/base/common/uri");
exports.ILanguageService = Symbol('ILanguageService');
var DiagnosticSeverity;
(function (DiagnosticSeverity) {
    DiagnosticSeverity[DiagnosticSeverity["Error"] = 1] = "Error";
    DiagnosticSeverity[DiagnosticSeverity["Warning"] = 2] = "Warning";
    DiagnosticSeverity[DiagnosticSeverity["Information"] = 3] = "Information";
    DiagnosticSeverity[DiagnosticSeverity["Hint"] = 4] = "Hint";
})(DiagnosticSeverity = exports.DiagnosticSeverity || (exports.DiagnosticSeverity = {}));
var DiagnosticTag;
(function (DiagnosticTag) {
    DiagnosticTag[DiagnosticTag["Unnecessary"] = 1] = "Unnecessary";
    DiagnosticTag[DiagnosticTag["Deprecated"] = 2] = "Deprecated";
})(DiagnosticTag = exports.DiagnosticTag || (exports.DiagnosticTag = {}));
function asSeverity(severity) {
    if (severity === 1) {
        return ide_core_common_1.MarkerSeverity.Error;
    }
    if (severity === 2) {
        return ide_core_common_1.MarkerSeverity.Warning;
    }
    if (severity === 3) {
        return ide_core_common_1.MarkerSeverity.Info;
    }
    return ide_core_common_1.MarkerSeverity.Hint;
}
exports.asSeverity = asSeverity;
function asRelatedInformations(relatedInformation) {
    if (!relatedInformation) {
        return undefined;
    }
    return relatedInformation.map((item) => asRelatedInformation(item));
}
exports.asRelatedInformations = asRelatedInformations;
function asRelatedInformation(relatedInformation) {
    return {
        resource: uri_1.URI.parse(relatedInformation.location.uri),
        startLineNumber: relatedInformation.location.range.start.line + 1,
        startColumn: relatedInformation.location.range.start.character + 1,
        endLineNumber: relatedInformation.location.range.end.line + 1,
        endColumn: relatedInformation.location.range.end.character + 1,
        message: relatedInformation.message,
    };
}
exports.asRelatedInformation = asRelatedInformation;
function asMonacoDiagnostics(diagnostics) {
    if (!diagnostics) {
        return undefined;
    }
    return diagnostics.map((diagnostic) => asMonacoDiagnostic(diagnostic));
}
exports.asMonacoDiagnostics = asMonacoDiagnostics;
function asMonacoDiagnostic(diagnostic) {
    return {
        code: typeof diagnostic.code === 'number'
            ? diagnostic.code.toString()
            : typeof diagnostic.code === 'object'
                ? {
                    value: diagnostic.code.value.toString(),
                    target: diagnostic.code.target,
                }
                : diagnostic.code,
        severity: asSeverity(diagnostic.severity),
        message: diagnostic.message,
        source: diagnostic.source,
        // language server range is 0-based, marker is 1-based
        startLineNumber: diagnostic.range.start.line + 1,
        startColumn: diagnostic.range.start.character + 1,
        endLineNumber: diagnostic.range.end.line + 1,
        endColumn: diagnostic.range.end.character + 1,
        relatedInformation: asRelatedInformations(diagnostic.relatedInformation),
        tags: diagnostic.tags,
    };
}
exports.asMonacoDiagnostic = asMonacoDiagnostic;
//# sourceMappingURL=language.js.map