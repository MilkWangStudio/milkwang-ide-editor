import { PreferenceSchema, PreferenceProxy } from '@opensumi/ide-core-browser';
export declare const USUAL_WORD_SEPARATORS = "`~!@#$%^&*()-=+[{]}\\|;:'\",.<>/?";
export declare const EDITOR_FONT_DEFAULTS: {
    fontFamily: string;
    fontWeight: string;
    fontSize: number;
    tabSize: number;
    renderWhitespace: boolean;
    cursorStyle: string;
    insertSpace: boolean;
    wordWrap: string;
    wordWrapColumn: number;
    lineHeight: number;
    letterSpacing: number;
};
export declare const EDITOR_MODEL_DEFAULTS: {
    tabSize: number;
    indentSize: number;
    insertSpaces: boolean;
    detectIndentation: boolean;
    trimAutoWhitespace: boolean;
    largeFileOptimizations: boolean;
};
export declare const EDITOR_SUGGEST_DEFAULTS: {
    insertMode: string;
    filterGraceful: boolean;
    snippetsPreventQuickSuggestions: boolean;
    localityBonus: boolean;
    shareSuggestSelections: boolean;
    showIcons: boolean;
    maxVisibleSuggestions: number;
    showMethods: boolean;
    showFunctions: boolean;
    showConstructors: boolean;
    showFields: boolean;
    showVariables: boolean;
    showClasses: boolean;
    showStructs: boolean;
    showInterfaces: boolean;
    showModules: boolean;
    showProperties: boolean;
    showEvents: boolean;
    showOperators: boolean;
    showUnits: boolean;
    showValues: boolean;
    showConstants: boolean;
    showEnums: boolean;
    showEnumMembers: boolean;
    showKeywords: boolean;
    showWords: boolean;
    showColors: boolean;
    showFiles: boolean;
    showReferences: boolean;
    showFolders: boolean;
    showTypeParameters: boolean;
    showSnippets: boolean;
    showUsers: boolean;
    showIssues: boolean;
    detailsVisible: boolean;
    preview: boolean;
    statusBar: {
        visible: boolean;
    };
};
export declare const EDITOR_INLINE_SUGGEST_DEFAULTS: {
    enabled: boolean;
};
export declare const enum WrappingIndent {
    /**
     * No indentation => wrapped lines begin at column 1.
     */
    None = 0,
    /**
     * Same => wrapped lines get the same indentation as the parent.
     */
    Same = 1,
    /**
     * Indent => wrapped lines get +1 indentation toward the parent.
     */
    Indent = 2,
    /**
     * DeepIndent => wrapped lines get +2 indentation toward the parent.
     */
    DeepIndent = 3
}
export declare const EDITOR_DEFAULTS: {
    inDiffEditor: boolean;
    wordSeparators: string;
    lineNumbersMinChars: number;
    lineDecorationsWidth: number;
    readOnly: boolean;
    mouseStyle: string;
    disableLayerHinting: boolean;
    automaticLayout: boolean;
    wordWrap: string;
    wordWrapColumn: number;
    wordWrapMinified: boolean;
    wrappingIndent: WrappingIndent;
    wordWrapBreakBeforeCharacters: string;
    wordWrapBreakAfterCharacters: string;
    wordWrapBreakObtrusiveCharacters: string;
    autoClosingBrackets: string;
    autoClosingQuotes: string;
    autoSurround: string;
    autoIndent: boolean;
    dragAndDrop: boolean;
    emptySelectionClipboard: boolean;
    copyWithSyntaxHighlighting: boolean;
    useTabStops: boolean;
    multiCursorModifier: string;
    multiCursorMergeOverlapping: boolean;
    accessibilitySupport: string;
    showUnused: boolean;
    wrappingStrategy: string;
    viewInfo: {
        extraEditorClassName: string;
        disableMonospaceOptimizations: boolean;
        rulers: never[];
        ariaLabel: string;
        renderLineNumbers: number;
        renderCustomLineNumbers: null;
        renderFinalNewline: boolean;
        selectOnLineNumbers: boolean;
        glyphMargin: boolean;
        revealHorizontalRightPadding: number;
        roundedSelection: boolean;
        overviewRulerLanes: number;
        overviewRulerBorder: boolean;
        cursorBlinking: number;
        mouseWheelZoom: boolean;
        cursorSmoothCaretAnimation: boolean;
        cursorStyle: number;
        cursorWidth: number;
        hideCursorInOverviewRuler: boolean;
        scrollBeyondLastLine: boolean;
        scrollBeyondLastColumn: number;
        smoothScrolling: boolean;
        stopRenderingLineAfter: number;
        renderWhitespace: string;
        renderControlCharacters: boolean;
        fontLigatures: boolean;
        renderLineHighlight: string;
        scrollbar: {
            vertical: number;
            horizontal: number;
            arrowSize: number;
            useShadows: boolean;
            verticalHasArrows: boolean;
            horizontalHasArrows: boolean;
            horizontalScrollbarSize: number;
            horizontalSliderSize: number;
            verticalScrollbarSize: number;
            verticalSliderSize: number;
            handleMouseWheel: boolean;
            mouseWheelScrollSensitivity: number;
            fastScrollSensitivity: number;
        };
        minimap: {
            enabled: boolean;
            side: string;
            showSlider: string;
            renderCharacters: boolean;
            maxColumn: number;
        };
        guides: {
            indentation: boolean;
            highlightActiveIndentGuide: boolean;
            bracketPairs: boolean;
        };
        fixedOverflowWidgets: boolean;
    };
    contribInfo: {
        selectionClipboard: boolean;
        hover: {
            enabled: boolean;
            delay: number;
            sticky: boolean;
        };
        links: boolean;
        contextmenu: boolean;
        quickSuggestions: {
            other: boolean;
            comments: boolean;
            strings: boolean;
        };
        quickSuggestionsDelay: number;
        parameterHints: {
            enabled: boolean;
            cycle: boolean;
        };
        formatOnType: boolean;
        formatOnPaste: boolean;
        suggestOnTriggerCharacters: boolean;
        acceptSuggestionOnEnter: string;
        acceptSuggestionOnCommitCharacter: boolean;
        wordBasedSuggestions: boolean;
        suggestSelection: string;
        suggestFontSize: number;
        suggestLineHeight: number;
        tabCompletion: string;
        gotoLocation: {
            multiple: string;
        };
        selectionHighlight: boolean;
        occurrencesHighlight: boolean;
        codeLens: boolean;
        folding: boolean;
        foldingStrategy: string;
        showFoldingControls: string;
        matchBrackets: boolean;
        find: {
            seedSearchStringFromSelection: boolean;
            autoFindInSelection: boolean;
            globalFindClipboard: boolean;
            addExtraSpaceOnTop: boolean;
        };
        colorDecorators: boolean;
        lightbulbEnabled: boolean;
        codeActionsOnSave: {};
        codeActionsOnSaveTimeout: number;
    };
};
export declare const editorPreferenceSchema: PreferenceSchema;
export declare const EditorPreferences: unique symbol;
export type EditorPreferences = PreferenceProxy<{
    'editor.readonlyFiles': string[];
    'editor.previewMode': boolean;
    'editor.autoSaveDelay': number;
    'editor.autoSave': string;
}>;
//# sourceMappingURL=schema.d.ts.map