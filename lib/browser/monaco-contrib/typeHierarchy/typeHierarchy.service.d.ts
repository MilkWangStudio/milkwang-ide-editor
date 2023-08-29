import { CancellationToken, IPosition, RefCountedDisposable, Uri } from '@opensumi/ide-core-common';
import { TypeHierarchyItem, ITypeHierarchyService, TypeHierarchyProvider } from '@opensumi/ide-monaco/lib/browser/contrib/typeHierarchy';
import { ITextModel, Position } from '@opensumi/ide-monaco/lib/browser/monaco-api/types';
import { IEditorDocumentModelService } from '../../doc-model/types';
export declare class TypeHierarchyModel {
    readonly id: string;
    readonly provider: TypeHierarchyProvider;
    readonly roots: TypeHierarchyItem[];
    readonly ref: RefCountedDisposable;
    static create(model: ITextModel, position: IPosition, token: CancellationToken): Promise<TypeHierarchyModel | undefined>;
    readonly root: TypeHierarchyItem;
    private constructor();
    dispose(): void;
    fork(item: TypeHierarchyItem): TypeHierarchyModel;
    provideSupertypes(item: TypeHierarchyItem, token: CancellationToken): Promise<TypeHierarchyItem[]>;
    provideSubtypes(item: TypeHierarchyItem, token: CancellationToken): Promise<TypeHierarchyItem[]>;
}
export declare class TypeHierarchyService implements ITypeHierarchyService {
    protected readonly modelService: IEditorDocumentModelService;
    private models;
    registerTypeHierarchyProvider(selector: any, provider: TypeHierarchyProvider): void;
    prepareTypeHierarchyProvider(resource: Uri, position: Position): Promise<TypeHierarchyItem[]>;
    provideSupertypes(item: TypeHierarchyItem): Promise<TypeHierarchyItem[] | undefined>;
    provideSubtypes(item: TypeHierarchyItem): Promise<TypeHierarchyItem[] | undefined>;
}
//# sourceMappingURL=typeHierarchy.service.d.ts.map