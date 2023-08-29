import React from 'react';
import { MaybeNull } from '@opensumi/ide-core-browser';
import { IResource } from '../common';
import { EditorGrid } from './grid/grid.service';
import { IEditorComponent } from './types';
import { EditorGroup } from './workbench-editor.service';
export declare const EditorView: () => JSX.Element | null;
export declare const EditorGridView: ({ grid }: {
    grid: EditorGrid;
}) => JSX.Element;
export declare const EditorGroupView: React.FunctionComponent<{
    group: EditorGroup;
}>;
export declare const EditorGroupBody: React.FunctionComponent<{
    group: EditorGroup;
}>;
export declare const ComponentsWrapper: ({ component, resources, current, ...other }: {
    component: IEditorComponent;
    resources: IResource[];
    current: MaybeNull<IResource>;
}) => JSX.Element;
export declare const ComponentWrapper: ({ component, resource, hidden, ...other }: {
    [x: string]: any;
    component: any;
    resource: any;
    hidden: any;
}) => JSX.Element;
//# sourceMappingURL=editor.view.d.ts.map