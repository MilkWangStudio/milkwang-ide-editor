import React from 'react';
import { IBreadCrumbPart } from './types';
import { EditorGroup } from './workbench-editor.service';
export declare const NavigationBar: ({ editorGroup }: {
    editorGroup: EditorGroup;
}) => JSX.Element | null;
export declare const NavigationItem: React.MemoExoticComponent<({ part, editorGroup }: {
    part: IBreadCrumbPart;
    editorGroup: EditorGroup;
}) => JSX.Element>;
export declare const NavigationMenu: React.FunctionComponent<{
    model: NavigationMenuModel;
}>;
export declare const NavigationMenuContainer: React.FunctionComponent<object>;
export declare class NavigationBarViewService {
    current: NavigationMenuModel | undefined;
    editorGroup: EditorGroup;
    showMenu(parts: IBreadCrumbPart[], x: any, y: any, currentIndex: any, uri: any, editorGroup: any): void;
    dispose(): void;
}
export declare class NavigationMenuModel {
    readonly parts: IBreadCrumbPart[];
    readonly x: any;
    readonly y: any;
    readonly initialIndex: number;
    readonly uri: any;
    subMenu?: NavigationMenuModel;
    constructor(parts: IBreadCrumbPart[], x: any, y: any, initialIndex: number, uri: any);
    showSubMenu(parts: IBreadCrumbPart[], x: any, y: any, uri: any): void;
    dispose(): void;
}
//# sourceMappingURL=navigation.view.d.ts.map