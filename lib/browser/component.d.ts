import { IDisposable, IEventBus } from '@opensumi/ide-core-common';
import { IResource, IEditorOpenType } from '../common';
import { EditorComponentRegistry, IEditorComponent, IEditorComponentResolver, IEditorSideWidget, EditorSide } from './types';
export declare class EditorComponentRegistryImpl implements EditorComponentRegistry {
    eventBus: IEventBus;
    private components;
    private sideWidgets;
    private initialPropsMap;
    private resolvers;
    private normalizedResolvers;
    readonly perWorkbenchComponents: {};
    registerEditorComponent<T>(component: IEditorComponent<T>, initialProps?: any): IDisposable;
    registerEditorComponentResolver<T>(scheme: string | ((scheme: string) => number), resolver: IEditorComponentResolver<any>): IDisposable;
    resolveEditorComponent(resource: IResource): Promise<IEditorOpenType[]>;
    private calculateSchemeResolver;
    private getResolvers;
    getEditorComponent(id: string): IEditorComponent | null;
    getEditorInitialProps(id: string): any;
    clearPerWorkbenchComponentCache(componentId: string): void;
    getSideWidgets(side: EditorSide, resource: IResource): IEditorSideWidget<any>[];
    registerEditorSideWidget(widget: IEditorSideWidget<any>): IDisposable;
}
//# sourceMappingURL=component.d.ts.map