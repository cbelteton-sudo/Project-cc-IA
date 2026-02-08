export class CreateProjectDto {
    name: string;
    code?: string;
    currency?: string;
    startDate?: string | Date;
    endDate?: string | Date;
    globalBudget?: number;
    enablePMDashboard?: boolean;
}
