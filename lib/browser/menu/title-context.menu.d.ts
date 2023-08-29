import { IContextKeyService } from '@opensumi/ide-core-browser';
import { AbstractContextMenuService, ICtxMenuRenderer } from '@opensumi/ide-core-browser/lib/menu/next';
import { URI } from '@opensumi/ide-core-common';
import { IEditorGroup } from '../../common';
export declare class TabTitleMenuService {
    ctxMenuService: AbstractContextMenuService;
    ctxMenuRenderer: ICtxMenuRenderer;
    contextKeyService: IContextKeyService;
    private _editorTitleContextKey;
    private get editorTitleContextKey();
    show(x: number, y: number, uri: URI, group: IEditorGroup): void;
}
//# sourceMappingURL=title-context.menu.d.ts.map