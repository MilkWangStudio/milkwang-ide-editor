import { HTMLAttributes } from 'react';
import { EditorGroup } from './workbench-editor.service';
export interface ITabsProps {
    group: EditorGroup;
}
export declare const Tabs: ({ group }: ITabsProps) => JSX.Element;
export interface IEditorActionsBaseProps {
    group: EditorGroup;
    className?: string;
}
export type IEditorActionsProps = IEditorActionsBaseProps & HTMLAttributes<HTMLDivElement>;
export declare const EditorActions: any;
//# sourceMappingURL=tab.view.d.ts.map