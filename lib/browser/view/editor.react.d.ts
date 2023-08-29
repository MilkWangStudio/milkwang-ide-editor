import React from 'react';
import { URI } from '@opensumi/ide-core-browser';
import { ICodeEditor } from '../../common';
export interface ICodeEditorProps extends React.HTMLAttributes<HTMLDivElement> {
    uri?: URI;
    options?: any;
    editorRef?: (editor: ICodeEditor | undefined) => void;
}
export declare const CodeEditor: (props: ICodeEditorProps) => JSX.Element;
//# sourceMappingURL=editor.react.d.ts.map