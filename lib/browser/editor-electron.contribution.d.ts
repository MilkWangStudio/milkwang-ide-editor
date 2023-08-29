import { Injector } from '@opensumi/di';
import { IClientApp, ClientAppContribution, KeybindingContribution, KeybindingRegistry } from '@opensumi/ide-core-browser';
import { WithEventBus } from '@opensumi/ide-core-common';
import { IEditorDocumentModelContentRegistry } from './doc-model/types';
export declare class EditorElectronContribution extends WithEventBus implements ClientAppContribution, KeybindingContribution {
    injector: Injector;
    private workbenchEditorService;
    private cacheProvider;
    contentRegistry: IEditorDocumentModelContentRegistry;
    private readonly electronMainUIService;
    onResourceDecorationChangeEvent(): void;
    /**
     * Return true in order to prevent exit
     */
    onWillStop(app: IClientApp): Promise<boolean>;
    registerKeybindings(keybindings: KeybindingRegistry): void;
}
//# sourceMappingURL=editor-electron.contribution.d.ts.map