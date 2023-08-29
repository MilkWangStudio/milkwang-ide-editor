import { PreferenceService } from '@opensumi/ide-core-browser';
import { DisposableCollection } from '@opensumi/ide-core-browser';
import { IEditor } from '../../common';
import { IEditorFeatureContribution } from '../types';
export declare class EditorSuggestWidgetContribution implements IEditorFeatureContribution {
    private readonly eventBus;
    protected readonly preferenceService: PreferenceService;
    contribute(editor: IEditor): DisposableCollection;
}
//# sourceMappingURL=suggest-widget.d.ts.map