import { IDisposable, Disposable, ILogger } from '@opensumi/ide-core-browser';
import { IContextMenu } from '@opensumi/ide-core-browser/lib/menu/next';
import { IEditorGroup } from '../../common';
import { IEditorActionRegistry } from '../types';
export declare class EditorActionRegistryImpl extends Disposable implements IEditorActionRegistry {
    private _cachedMenus;
    private contextKeyService;
    private readonly menuService;
    logger: ILogger;
    registerEditorAction(): IDisposable;
    getMenu(group: IEditorGroup): IContextMenu;
}
//# sourceMappingURL=editor.menu.d.ts.map