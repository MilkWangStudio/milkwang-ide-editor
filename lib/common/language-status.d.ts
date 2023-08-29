import { IAccessibilityInformation, IDisposable, Severity, Event, StatusBarHoverCommand } from '@opensumi/ide-core-common';
import type { ITextModel } from '@opensumi/ide-monaco/lib/browser/monaco-api/types';
import { LanguageSelector } from './language';
export declare const ILanguageStatusService: unique symbol;
export interface ILanguageStatusService {
    onDidChange: Event<void>;
    addStatus(status: ILanguageStatus): IDisposable;
    getLanguageStatus(model: ITextModel): ILanguageStatus[];
}
export interface ILanguageStatus {
    readonly id: string;
    readonly name: string;
    readonly selector: LanguageSelector;
    readonly severity: Severity;
    readonly label: string;
    readonly detail: string;
    readonly source: string;
    readonly command?: StatusBarHoverCommand;
    readonly accessibilityInfo: IAccessibilityInformation | undefined;
    readonly busy: boolean;
}
//# sourceMappingURL=language-status.d.ts.map