import { Disposable, IEventBus, ILogger, IRange, PreferenceService, URI } from '@opensumi/ide-core-browser';
import { EOL, ITextModel } from '@opensumi/ide-monaco/lib/browser/monaco-api/types';
import { IMessageService } from '@opensumi/ide-overlay';
import { ISingleEditOperation } from '@opensumi/monaco-editor-core/esm/vs/editor/common/core/editOperation';
import { ITextBuffer } from '@opensumi/monaco-editor-core/esm/vs/editor/common/model';
import { IDocPersistentCacheProvider, SaveReason, IEditorDocumentModelContentChange } from '../../common';
import { EditorPreferences } from '../preference/schema';
import { ICompareService } from '../types';
import { IEditorDocumentModelServiceImpl } from './save-task';
import { IEditorDocumentModel, IEditorDocumentModelContentRegistry, IDocModelUpdateOptions } from './types';
export interface EditorDocumentModelConstructionOptions {
    eol?: EOL;
    encoding?: string;
    languageId?: string;
    readonly?: boolean;
    savable?: boolean;
    alwaysDirty?: boolean;
    closeAutoSave?: boolean;
    disposeEvenDirty?: boolean;
}
export interface IDirtyChange {
    fromVersionId: number;
    toVersionId: number;
    changes: IEditorDocumentModelContentChange[];
}
export declare class EditorDocumentModel extends Disposable implements IEditorDocumentModel {
    readonly uri: URI;
    contentRegistry: IEditorDocumentModelContentRegistry;
    service: IEditorDocumentModelServiceImpl;
    compareService: ICompareService;
    cacheProvider: IDocPersistentCacheProvider;
    editorPreferences: EditorPreferences;
    messageService: IMessageService;
    eventBus: IEventBus;
    logger: ILogger;
    private commandService;
    private reporter;
    preferences: PreferenceService;
    private readonly hashCalculateService;
    private saveQueue;
    private monacoModel;
    _encoding: string;
    readonly readonly: boolean;
    readonly savable: boolean;
    readonly alwaysDirty: boolean;
    readonly closeAutoSave: boolean;
    readonly disposeEvenDirty: boolean;
    private _originalEncoding;
    private _persistVersionId;
    private _baseContent;
    private _baseContentMd5;
    private savingTasks;
    private dirtyChanges;
    private _previousVersionId;
    private _tryAutoSaveAfterDelay;
    private _isInitOption;
    private readonly _onDidChangeEncoding;
    readonly onDidChangeEncoding: import("@opensumi/ide-core-browser").Event<void>;
    constructor(uri: URI, content: string, options?: EditorDocumentModelConstructionOptions);
    updateOptions(options: IDocModelUpdateOptions): void;
    private listenTo;
    private readCacheToApply;
    private applyCache;
    cleanAndUpdateContent(content: any): void;
    updateEncoding(encoding: string): Promise<void>;
    get encoding(): string;
    set eol(eol: EOL);
    get eol(): EOL;
    get dirty(): boolean;
    set languageId(languageId: string);
    get languageId(): string;
    get id(): string;
    getMonacoModel(): ITextModel;
    save(force?: boolean, reason?: SaveReason): Promise<boolean>;
    private compareAndSave;
    initSave(): Promise<void>;
    setPersist(versionId: number): void;
    reload(): Promise<void>;
    revert(notOnDisk?: boolean): Promise<void>;
    getText(range?: IRange): string;
    updateContent(content: string, eol?: EOL, setPersist?: boolean): void;
    /**
     * Compute edits to bring `model` to the state of `textSource`.
     */
    static _computeEdits(model: ITextModel, textBuffer: ITextBuffer): ISingleEditOperation[];
    private static _commonPrefix;
    private static _commonSuffix;
    set baseContent(content: string);
    get baseContent(): string;
    get baseContentMd5(): string;
    get tryAutoSaveAfterDelay(): () => any;
    getBaseContentMd5(): string;
    private notifyChangeEvent;
    protected formatOnSave(reason: SaveReason): Promise<void>;
}
//# sourceMappingURL=editor-document-model.d.ts.map