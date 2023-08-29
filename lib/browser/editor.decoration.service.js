"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorDecorationCollectionService = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const ide_theme_1 = require("@opensumi/ide-theme");
const style_1 = require("@opensumi/ide-theme/lib/common/style");
const types_1 = require("./types");
let EditorDecorationCollectionService = class EditorDecorationCollectionService {
    constructor() {
        this.decorations = new Map();
        this.tempId = 0;
        this.decorationProviders = new Map();
    }
    getNextTempId() {
        this.tempId++;
        return 'temp-decoration-' + this.tempId;
    }
    createTextEditorDecorationType(options, key) {
        if (!key) {
            key = this.getNextTempId();
        }
        const property = this.resolveDecoration(key, options);
        const type = {
            key,
            property,
            dispose: () => {
                if (key && this.decorations.has(key)) {
                    property.dispose();
                    this.decorations.delete(key);
                    this.eventBus.fire(new types_1.EditorDecorationTypeRemovedEvent(key));
                }
            },
        };
        this.decorations.set(key, type);
        return type;
    }
    getTextEditorDecorationType(key) {
        return this.decorations.get(key);
    }
    resolveDecoration(key, options) {
        const dec = {
            default: this.addedThemeDecorationToCSSStyleSheet(key, options),
            light: options.light ? this.addedThemeDecorationToCSSStyleSheet(key + '-light', options.light) : null,
            dark: options.dark ? this.addedThemeDecorationToCSSStyleSheet(key + '-dark', options.dark) : null,
            isWholeLine: options.isWholeLine || false,
            overviewRulerLane: options.overviewRulerLane,
            dispose: () => {
                dec.default.dispose();
                if (dec.light) {
                    dec.light.dispose();
                }
                if (dec.dark) {
                    dec.dark.dispose();
                }
            },
        };
        return dec;
    }
    addedThemeDecorationToCSSStyleSheet(key, options) {
        const className = key;
        const inlineClassName = key + '-inline';
        const disposer = new ide_core_browser_1.Disposable();
        let afterContentClassName;
        let beforeContentClassName;
        let glyphMarginClassName;
        const styles = this.resolveCSSStyle(options);
        const inlineStyles = this.resolveInlineCSSStyle(options);
        disposer.addDispose(this.cssManager.addClass(className, styles));
        disposer.addDispose(this.cssManager.addClass(inlineClassName, inlineStyles));
        if (options.after) {
            const styles = this.resolveContentCSSStyle(options.after);
            disposer.addDispose(this.cssManager.addClass(key + '-after::after', styles));
            afterContentClassName = key + '-after';
            // 最新版chrome 中 document.caretRangeFromRange 的行为有所改变
            // 如果目标位置命中的是两个inline元素之间, 它会认为是前一个元素的内容。
            // 在之前这个结果是属于公共父级
            // 这个改变会使得monaco中hitTest返回错误的结果，导致点击decoration的空白区域时会错误选中文本
            // 临时修复:
            // 此处将before和after的父级span display强制设置为inline-block, 可以避免这个问题, 是否会带来其他风险未知
            disposer.addDispose(this.cssManager.addClass(afterContentClassName, { display: 'inline-block' }));
        }
        if (options.before) {
            const styles = this.resolveContentCSSStyle(options.before);
            disposer.addDispose(this.cssManager.addClass(key + '-before::before', styles));
            beforeContentClassName = key + '-before';
            disposer.addDispose(this.cssManager.addClass(beforeContentClassName, { display: 'inline-block' }));
        }
        if (options.gutterIconPath) {
            const glyphMarginStyle = this.resolveCSSStyle({
                backgroundIconSize: options.gutterIconSize,
                backgroundIcon: options.gutterIconPath.toString(),
            });
            glyphMarginClassName = key + '-glyphMargin';
            disposer.addDispose(this.cssManager.addClass(glyphMarginClassName, glyphMarginStyle));
        }
        return {
            className,
            inlineClassName,
            afterContentClassName,
            beforeContentClassName,
            glyphMarginClassName,
            overviewRulerColor: options.overviewRulerColor,
            dispose() {
                return disposer.dispose();
            },
        };
    }
    resolveCSSStyle(styles) {
        var _a;
        const iconPath = ((_a = styles.backgroundIcon) === null || _a === void 0 ? void 0 : _a.startsWith('data:'))
            ? this.iconService.encodeBase64Path(decodeURIComponent(styles.backgroundIcon))
            : styles.backgroundIcon;
        return {
            backgroundColor: this.themeService.getColorVar(styles.backgroundColor),
            background: styles.backgroundIcon ? `url("${iconPath}") center center no-repeat` : undefined,
            backgroundSize: styles.backgroundIconSize ? `${styles.backgroundIconSize}` : undefined,
            outline: styles.outline,
            outlineColor: styles.outlineColor,
            outlineStyle: styles.outlineStyle,
            outlineWidth: styles.outlineWidth,
            border: styles.border,
            borderColor: this.themeService.getColorVar(styles.borderColor),
            borderRadius: styles.borderRadius,
            borderSpacing: styles.borderSpacing,
            borderStyle: styles.borderStyle,
            borderWidth: styles.borderWidth,
        };
    }
    resolveInlineCSSStyle(styles) {
        return {
            fontStyle: styles.fontStyle,
            fontWeight: styles.fontWeight,
            textDecoration: styles.textDecoration,
            textUnderlinePosition: styles.textUnderlinePosition,
            cursor: styles.cursor,
            color: this.themeService.getColorVar(styles.color),
            opacity: styles.opacity,
            letterSpacing: styles.letterSpacing,
        };
    }
    resolveContentCSSStyle(styles) {
        let content;
        if (styles.contentText) {
            content = `"${styles.contentText}"`;
        }
        else if (styles.contentIconPath) {
            content = `url('${ide_core_browser_1.URI.from(styles.contentIconPath).toString(true).replace(/'/g, '%27')}')`;
        }
        return {
            display: 'block',
            content,
            border: styles.border,
            borderColor: this.themeService.getColorVar(styles.borderColor),
            fontStyle: styles.fontStyle,
            fontWeight: styles.fontWeight,
            textDecoration: styles.textDecoration,
            color: this.themeService.getColorVar(styles.color),
            backgroundColor: this.themeService.getColorVar(styles.backgroundColor),
            margin: styles.margin,
            width: styles.width,
            height: styles.height,
        };
    }
    registerDecorationProvider(provider) {
        this.decorationProviders.set(provider.key, provider);
        this.eventBus.fire(new types_1.EditorDecorationProviderRegistrationEvent(provider));
        const disposer = provider.onDidDecorationChange((uri) => {
            this.eventBus.fire(new types_1.EditorDecorationChangeEvent({ uri, key: provider.key }));
        });
        return {
            dispose: () => {
                if (this.decorationProviders.get(provider.key) === provider) {
                    this.decorationProviders.delete(provider.key);
                    this.eventBus.fire(new types_1.EditorDecorationTypeRemovedEvent(provider.key));
                }
                disposer.dispose();
            },
        };
    }
    async getDecorationFromProvider(uri, key) {
        const result = {};
        let decorationProviders = [];
        if (!key) {
            decorationProviders = Array.from(this.decorationProviders.values());
        }
        else {
            if (this.decorationProviders.has(key)) {
                decorationProviders.push(this.decorationProviders.get(key));
            }
        }
        await Promise.all(decorationProviders.map(async (provider) => {
            if (provider.schemes && provider.schemes.indexOf(uri.scheme) === -1) {
                return;
            }
            const decoration = await provider.provideEditorDecoration(uri);
            if (decoration) {
                result[provider.key] = decoration;
            }
        }));
        return result;
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(style_1.ICSSStyleService),
    tslib_1.__metadata("design:type", Object)
], EditorDecorationCollectionService.prototype, "cssManager", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_theme_1.IThemeService),
    tslib_1.__metadata("design:type", Object)
], EditorDecorationCollectionService.prototype, "themeService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_theme_1.IIconService),
    tslib_1.__metadata("design:type", Object)
], EditorDecorationCollectionService.prototype, "iconService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.IEventBus),
    tslib_1.__metadata("design:type", Object)
], EditorDecorationCollectionService.prototype, "eventBus", void 0);
EditorDecorationCollectionService = tslib_1.__decorate([
    (0, di_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [])
], EditorDecorationCollectionService);
exports.EditorDecorationCollectionService = EditorDecorationCollectionService;
//# sourceMappingURL=editor.decoration.service.js.map