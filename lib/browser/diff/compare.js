"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompareEditorContribution = exports.CompareService = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const ide_core_browser_2 = require("@opensumi/ide-core-browser");
const next_1 = require("@opensumi/ide-core-browser/lib/menu/next");
const types_1 = require("../types");
let CompareService = class CompareService {
    constructor() {
        this.comparing = new Map();
    }
    compare(original, modified, name) {
        const compareUri = ide_core_browser_1.URI.from({
            scheme: 'diff',
            query: ide_core_browser_1.URI.stringifyQuery({
                name,
                original,
                modified,
                comparing: true,
            }),
        });
        if (!this.comparing.has(compareUri.toString())) {
            const deferred = new ide_core_browser_1.Deferred();
            this.comparing.set(compareUri.toString(), deferred);
            deferred.promise.then(() => {
                this.comparing.delete(compareUri.toString());
                this.commandService.executeCommand(ide_core_browser_1.EDITOR_COMMANDS.CLOSE_ALL.id, compareUri);
            });
        }
        this.commandService.executeCommand(ide_core_browser_1.EDITOR_COMMANDS.OPEN_RESOURCE.id, compareUri);
        return this.comparing.get(compareUri.toString()).promise;
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(ide_core_browser_1.CommandService),
    tslib_1.__metadata("design:type", Object)
], CompareService.prototype, "commandService", void 0);
CompareService = tslib_1.__decorate([
    (0, di_1.Injectable)()
], CompareService);
exports.CompareService = CompareService;
let CompareEditorContribution = class CompareEditorContribution {
    registerMenus(menu) {
        menu.registerMenuItems(next_1.MenuId.EditorTitle, [
            {
                command: {
                    id: 'editor.diff.accept',
                    label: (0, ide_core_browser_1.localize)('editor.action.accept'),
                },
                iconClass: (0, ide_core_browser_2.getIcon)('check'),
                group: 'navigation',
                when: 'isInDiffEditor && diffResource =~ /%26comparing%3Dtrue$/',
            },
        ]);
        menu.registerMenuItems(next_1.MenuId.EditorTitle, [
            {
                command: {
                    id: 'editor.diff.revert',
                    label: (0, ide_core_browser_1.localize)('editor.action.revert'),
                },
                iconClass: (0, ide_core_browser_2.getIcon)('rollback'),
                group: 'navigation',
                when: 'isInDiffEditor && diffResource =~ /%26comparing%3Dtrue$/',
            },
        ]);
    }
    registerCommands(commands) {
        commands.registerCommand({ id: 'editor.diff.accept' }, {
            execute: (uri) => {
                if (uri && this.compareService.comparing.has(uri.toString())) {
                    this.compareService.comparing.get(uri.toString()).resolve(types_1.CompareResult.accept);
                }
            },
        });
        commands.registerCommand({ id: 'editor.diff.revert' }, {
            execute: (uri) => {
                if (uri && this.compareService.comparing.has(uri.toString())) {
                    this.compareService.comparing.get(uri.toString()).resolve(types_1.CompareResult.revert);
                }
            },
        });
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(types_1.ICompareService),
    tslib_1.__metadata("design:type", CompareService)
], CompareEditorContribution.prototype, "compareService", void 0);
CompareEditorContribution = tslib_1.__decorate([
    (0, ide_core_browser_1.Domain)(next_1.MenuContribution, ide_core_browser_1.CommandContribution)
], CompareEditorContribution);
exports.CompareEditorContribution = CompareEditorContribution;
//# sourceMappingURL=compare.js.map