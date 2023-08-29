"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenTypeMenuContribution = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@opensumi/di");
const ide_core_browser_1 = require("@opensumi/ide-core-browser");
const next_1 = require("@opensumi/ide-core-browser/lib/menu/next");
const ide_core_common_1 = require("@opensumi/ide-core-common");
const di_helper_1 = require("@opensumi/ide-core-common/lib/di-helper");
const types_1 = require("../types");
const workbench_editor_service_1 = require("./../workbench-editor.service");
var OPEN_TYPE_COMMANDS;
(function (OPEN_TYPE_COMMANDS) {
    OPEN_TYPE_COMMANDS.EDITOR_OPEN_TYPE = {
        id: 'editor.opentype',
    };
})(OPEN_TYPE_COMMANDS || (OPEN_TYPE_COMMANDS = {}));
let OpenTypeMenuContribution = class OpenTypeMenuContribution extends ide_core_common_1.Disposable {
    registerCommands(commands) {
        commands.registerCommand(OPEN_TYPE_COMMANDS.EDITOR_OPEN_TYPE, {
            execute: (...args) => {
                const tailArg = args[args.length - 1];
                if (tailArg && typeof tailArg === 'string') {
                    this.workbenchEditorService.currentEditorGroup.changeOpenType(tailArg);
                }
            },
        });
    }
    constructor() {
        super();
        this.disposables.push(this.workbenchEditorService.onActiveResourceChange((e) => {
            this.registerEditorOpenTypes();
        }));
    }
    registerEditorOpenTypes() {
        const openTypes = this.workbenchEditorService.currentEditorGroup.availableOpenTypes;
        // 如果打开方式没有两个以上，则不需要展示
        const preMenu = this.menuRegistry
            .getMenuItems(next_1.MenuId.OpenTypeSubmenuContext)
            .map((e) => e.command);
        preMenu.forEach((c) => {
            this.menuRegistry.unregisterMenuItem(next_1.MenuId.OpenTypeSubmenuContext, c.id);
        });
        this.menuRegistry.unregisterMenuItem(next_1.MenuId.EditorTitle, next_1.MenuId.OpenTypeSubmenuContext);
        if (openTypes.length >= 2) {
            this.registerMenuItem(openTypes);
        }
    }
    registerMenus(menuRegistry) { }
    registerMenuItem(openTypes) {
        const openTypeMenus = {
            submenu: next_1.MenuId.OpenTypeSubmenuContext,
            label: (0, ide_core_common_1.localize)('editor.openType'),
            group: 'navigation',
            order: Number.MIN_SAFE_INTEGER,
            iconClass: (0, ide_core_browser_1.getIcon)('setting'),
            type: 'default',
        };
        this.menuRegistry.registerMenuItem(next_1.MenuId.EditorTitle, openTypeMenus);
        openTypes.forEach((type) => {
            var _a;
            this.menuRegistry.registerMenuItem(next_1.MenuId.OpenTypeSubmenuContext, {
                command: {
                    id: OPEN_TYPE_COMMANDS.EDITOR_OPEN_TYPE.id,
                    label: type.title || type.componentId || type.type,
                },
                extraTailArgs: [(_a = type.componentId) !== null && _a !== void 0 ? _a : type.type],
                group: 'navigation',
            });
        });
    }
};
tslib_1.__decorate([
    (0, di_1.Autowired)(types_1.WorkbenchEditorService),
    tslib_1.__metadata("design:type", workbench_editor_service_1.WorkbenchEditorServiceImpl)
], OpenTypeMenuContribution.prototype, "workbenchEditorService", void 0);
tslib_1.__decorate([
    (0, di_1.Autowired)(next_1.IMenuRegistry),
    tslib_1.__metadata("design:type", next_1.IMenuRegistry)
], OpenTypeMenuContribution.prototype, "menuRegistry", void 0);
OpenTypeMenuContribution = tslib_1.__decorate([
    (0, di_helper_1.Domain)(ide_core_common_1.CommandContribution, next_1.MenuContribution),
    tslib_1.__metadata("design:paramtypes", [])
], OpenTypeMenuContribution);
exports.OpenTypeMenuContribution = OpenTypeMenuContribution;
//# sourceMappingURL=open-type-menu.contribution.js.map