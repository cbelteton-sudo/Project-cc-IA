export class CreateMaterialRequestItem {
    materialId: string;
    quantity: number;
}

export class CreateMaterialRequestDto {
    projectId: string;
    title: string;
    items: CreateMaterialRequestItem[];
}
