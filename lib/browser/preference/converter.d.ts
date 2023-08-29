import { IConfigurationService } from '@opensumi/monaco-editor-core/esm/vs/platform/configuration/common/configuration';
import { IConvertedMonacoOptions } from '../types';
/**
 * 计算由ConfigurationService设置值带来的monaco编辑器的属性
 * @param configurationService IConfigurationService
 * @param updatingKey 需要处理的Preference key。如果没有这个值，默认处理全部。
 */
export declare function getConvertedMonacoOptions(configurationService: IConfigurationService, resourceUri?: string, language?: string, updatingKey?: string[]): IConvertedMonacoOptions;
type NoConverter = false;
type KaitianPreferenceKey = string;
type MonacoPreferenceKey = string;
/**
 * monacoOption和Preference的转换
 */
interface IMonacoOptionsConverter {
    /**
     * monaco编辑器的设置值
     */
    monaco: MonacoPreferenceKey;
    /**
     * 转换器：输入为Preference值，输出monaco Options值
     */
    convert?: (value: any) => any;
}
/**
 * Configuration options for the editor.
 */
export declare const editorOptionsConverters: Map<KaitianPreferenceKey, NoConverter | IMonacoOptionsConverter>;
export declare const textModelUpdateOptionsConverters: Map<KaitianPreferenceKey, NoConverter | IMonacoOptionsConverter>;
export declare const diffEditorOptionsConverters: Map<KaitianPreferenceKey, NoConverter | IMonacoOptionsConverter>;
export declare function isEditorOption(key: string): boolean;
export declare function isDiffEditorOption(key: string): boolean;
export {};
//# sourceMappingURL=converter.d.ts.map