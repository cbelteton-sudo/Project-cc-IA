export class CreatePurchaseOrderItemDto {
    description: string;
    quantity: number;
    unitPrice: number;
    budgetLineId?: string;
}

export class CreatePurchaseOrderDto {
    projectId: string;
    vendor: string;
    items: CreatePurchaseOrderItemDto[];
}
