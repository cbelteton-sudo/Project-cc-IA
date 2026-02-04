export class CreateInvoiceDto {
    projectId: string;
    vendor: string;
    invoiceNumber: string;
    total: number;
    currency: string;
    date: string;
    fileUrl?: string; // For OCR flow
}
