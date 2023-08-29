import { ConstructorOf } from '@opensumi/ide-core-common';
export declare class EditorError extends Error {
    type: number;
}
export declare class EditorTabChangedError extends EditorError {
    static errorCode: number;
    type: number;
    constructor();
}
export type EditorErrorType = ConstructorOf<EditorError> & {
    errorCode: number;
};
export declare function isEditorError(e: any, type: EditorErrorType): any;
//# sourceMappingURL=error.d.ts.map