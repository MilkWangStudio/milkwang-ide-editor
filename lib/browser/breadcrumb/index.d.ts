import { IDisposable, URI, MaybeNull } from '@opensumi/ide-core-browser';
import { IEditor } from '../../common';
import { IBreadCrumbService, IBreadCrumbPart, IBreadCrumbProvider } from '../types';
import { DefaultBreadCrumbProvider } from './default';
export declare class BreadCrumbServiceImpl implements IBreadCrumbService {
    private providers;
    private _onDidUpdateBreadCrumbResults;
    readonly onDidUpdateBreadCrumbResults: import("@opensumi/ide-core-browser").Event<{
        uri: URI;
        editor: MaybeNull<IEditor>;
    }>;
    private crumbResults;
    defaultBreadCrumbProvider: DefaultBreadCrumbProvider;
    constructor();
    registerBreadCrumbProvider(provider: IBreadCrumbProvider): IDisposable;
    getBreadCrumbs(uri: URI, editor: MaybeNull<IEditor>): IBreadCrumbPart[] | undefined;
    getEditorCrumbResults(editor: MaybeNull<IEditor>): Map<string, IBreadCrumbPart[]>;
    disposeCrumb(uri: URI): void;
}
//# sourceMappingURL=index.d.ts.map