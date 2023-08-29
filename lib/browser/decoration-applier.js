"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonacoEditorDecorationApplier = void 0;
const tslib_1 = require("tslib");
const classnames_1 = tslib_1.__importDefault(require("classnames"));
const di_1 = require("@opensumi/di");
const ide_core_common_1 = require("@opensumi/ide-core-common");
const ide_theme_1 = require("@opensumi/ide-theme");
const types_1 = require("./types");
let MonacoEditorDecorationApplier = class MonacoEditorDecorationApplier extends ide_core_common_1.Disposable {
    constructor(editor) {
        super();
        this.editor = editor;
        this.decorations = new Map();
        this.applyDecorationFromProvider();
        this.editor.onDidChangeModel(() => {
            this.clearDecorations();
            this.applyDecorationFromProvider();
        });
        this.editor.onDidDispose(() => {
            this.dispose();
        });
        this.addDispose(this.eventBus.on(types_1.EditorDecorationChangeEvent, (e) => {
            const currentUri = this.getEditorUri();
            if (currentUri && e.payload.uri.isEqual(currentUri)) {
                this.applyDecorationFromProvider(e.payload.key);
            }
        }));
        this.addDispose(this.eventBus.on(types_1.EditorDecorationTypeRemovedEvent, (e) => {
            this.deltaDecoration(e.payload, []);
        }));
    }
    getEditorUri() {
        if (this.editor.getModel()) {
            const uri = new ide_core_common_1.URI(this.editor.getModel().uri.toString());
            return uri;
        }
        else {
            return null;
        }
    }
    async applyDecorationFromProvider(key) {
        if (this.editor.getModel()) {
            const uri = new ide_core_common_1.URI(this.editor.getModel().uri.toString());
            const decs = await this.decorationService.getDecorationFromProvider(uri, key);
            // 由于是异步获取decoration，此时uri可能已经变了
            if (!this.editor.getModel() || this.editor.getModel().uri.toString() !== uri.toString()) {
                return;
            }
            for (const key of Object.keys(decs)) {
                this.deltaDecoration(key, decs[key]);
            }
            this.eventBus.fire(new types_1.DidApplyEditorDecorationFromProvider({
                key,
                uri,
            }));
        }
    }
    dispose() {
        super.dispose();
        this.clearDecorations();
    }
    clearDecorations() {
        this.decorations.forEach((v) => {
            v.dispose();
            this.editor.deltaDecorations(v.decorations, []);
        });
        this.decorations.clear();
    }
    deltaDecoration(key, decorations) {
        let oldDecorations = [];
        if (this.decorations.has(key)) {
            oldDecorations = this.decorations.get(key).decorations;
            this.decorations.get(key).dispose();
            this.decorations.delete(key);
        }
        if (oldDecorations.length === 0 && decorations.length === 0) {
            return;
        }
        const newDecoration = this.editor.deltaDecorations(oldDecorations, decorations);
        this.decorations.set(key, {
            decorations: newDecoration,
            dispose: () => null,
        });
    }
    applyDecoration(key, options) {
        const oldDecorations = this.decorations.get(key);
        if (oldDecorations) {
            oldDecorations.dispose();
        }
        const oldResult = oldDecorations ? oldDecorations.decorations : [];
        const newDecorations = [];
        const disposer = new ide_core_common_1.Disposable();
        if (oldResult.length === 0 && options.length === 0) {
            return;
        }
        options.forEach((option) => {
            const resolved = this.resolveDecorationRenderer(key, option.renderOptions);
            newDecorations.push({
                range: option.range,
                options: Object.assign(Object.assign({}, resolved.options), { hoverMessage: resolveHoverMessage(option.hoverMessage) }),
            });
            disposer.addDispose(resolved);
        });
        const result = this.editor.deltaDecorations(oldResult, newDecorations);
        this.decorations.set(key, {
            decorations: result,
            dispose: () => disposer.dispose(),
        });
    }
    resolveDecorationRenderer(key, options) {
        const type = this.decorationService.getTextEditorDecorationType(key);
        const result = {
            description: key,
        };
        const currentTheme = this.themeService.getCurrentThemeSync().type;
        const disposer = new ide_core_common_1.Disposable();
        if (type) {
            const property = type.property;
            assignModelDecorationOptions(result, property, currentTheme);
        }
        if (options) {
            const tempType = this.decorationService.createTextEditorDecorationType(options);
            assignModelDecorationOptions(result, tempType.property, currentTheme);
            disposer.addDispose(tempType);
        }
        return {
            options: result,
            dispose: () => disposer.dispose(),
        };
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(types_1.IEditorDecorationCollectionService),
    tslib_1.__metadata("design:type", Object)
], MonacoEditorDecorationApplier.prototype, "decorationService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_theme_1.IThemeService),
    tslib_1.__metadata("design:type", Object)
], MonacoEditorDecorationApplier.prototype, "themeService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_common_1.IEventBus),
    tslib_1.__metadata("design:type", Object)
], MonacoEditorDecorationApplier.prototype, "eventBus", void 0);
MonacoEditorDecorationApplier = tslib_1.__decorate([
    (0, di_1.Injectable)({ multiple: true }),
    tslib_1.__metadata("design:paramtypes", [Object])
], MonacoEditorDecorationApplier);
exports.MonacoEditorDecorationApplier = MonacoEditorDecorationApplier;
function assignModelDecorationOptions(target, property, currentTheme) {
    if (property.overviewRulerLane) {
        if (!target.overviewRuler) {
            target.overviewRuler = {
                color: null,
                range: null,
                position: property.overviewRulerLane,
            };
        }
        else {
            target.overviewRuler.position = property.overviewRulerLane;
        }
    }
    if (property.default) {
        assignModelDecorationStyle(target, property.default);
    }
    if (currentTheme === 'dark' && property.dark) {
        assignModelDecorationStyle(target, property.dark);
    }
    if (currentTheme === 'light' && property.light) {
        assignModelDecorationStyle(target, property.light);
    }
    if (property.isWholeLine !== undefined) {
        target.isWholeLine = property.isWholeLine;
    }
    if (property.rangeBehavior) {
        target.stickiness = property.rangeBehavior;
    }
    target.inlineClassNameAffectsLetterSpacing = true;
}
function assignModelDecorationStyle(target, style) {
    if (style.className) {
        target.className = (0, classnames_1.default)(target.className, style.className);
    }
    if (style.inlineClassName) {
        target.inlineClassName = (0, classnames_1.default)(target.inlineClassName, style.inlineClassName);
    }
    if (style.afterContentClassName) {
        target.afterContentClassName = (0, classnames_1.default)(target.afterContentClassName, style.afterContentClassName);
    }
    if (style.beforeContentClassName) {
        target.beforeContentClassName = (0, classnames_1.default)(target.beforeContentClassName, style.beforeContentClassName);
    }
    if (style.glyphMarginClassName) {
        target.glyphMarginClassName = (0, classnames_1.default)(target.glyphMarginClassName, style.glyphMarginClassName);
    }
    if (style.overviewRulerColor) {
        if (target.overviewRuler) {
            target.overviewRuler.color = style.overviewRulerColor;
        }
    }
}
function resolveHoverMessage(str) {
    if (!str) {
        return undefined;
    }
    if (str instanceof Array) {
        return str.map(toMarkdownString);
    }
    else {
        return toMarkdownString(str);
    }
}
function toMarkdownString(str) {
    if (typeof str === 'string') {
        return {
            value: str,
            isTrusted: true,
        };
    }
    else {
        return str;
    }
}
//# sourceMappingURL=decoration-applier.js.map