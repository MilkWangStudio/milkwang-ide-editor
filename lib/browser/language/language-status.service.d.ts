import { Event, IDisposable } from '@opensumi/ide-core-common';
import { ITextModel } from '@opensumi/monaco-editor-core/esm/vs/editor/common/model';
import { ILanguageStatusService, ILanguageStatus } from '../../common';
export declare class LanguageStatusService implements ILanguageStatusService {
    private readonly _provider;
    readonly onDidChange: Event<any>;
    addStatus(status: ILanguageStatus): IDisposable;
    getLanguageStatus(model: ITextModel): ILanguageStatus[];
}
//# sourceMappingURL=language-status.service.d.ts.map