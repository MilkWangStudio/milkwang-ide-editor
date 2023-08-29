import { ITextModel } from '@opensumi/ide-monaco/lib/browser/monaco-api/types';
import { FormattingMode } from '@opensumi/monaco-editor-core/esm/vs/editor/contrib/format/browser/format';
import * as monaco from '@opensumi/monaco-editor-core/esm/vs/editor/editor.api';
export declare class FormattingSelector {
    private quickPickService;
    private preferenceService;
    private modelService;
    select(formatters: Array<monaco.languages.DocumentFormattingEditProvider | monaco.languages.DocumentRangeFormattingEditProvider>, document: ITextModel, mode: FormattingMode, forceSelect?: boolean): Promise<monaco.languages.DocumentFormattingEditProvider | monaco.languages.DocumentRangeFormattingEditProvider | undefined>;
}
//# sourceMappingURL=formatterSelect.d.ts.map