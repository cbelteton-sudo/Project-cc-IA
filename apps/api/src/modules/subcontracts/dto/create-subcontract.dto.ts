export class CreateSubcontractDto {
    projectId: string;
    vendor: string;
    title: string;
    totalAmount: number;
    startDate?: string;
    endDate?: string;
}
