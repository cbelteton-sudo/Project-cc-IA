export class CreateActivityDto {
    projectId: string;
    parentId?: string;
    name: string;
    code?: string;
    startDate: string | Date; // Allow string from JSON
    endDate: string | Date;
    contractorId?: string;
    plannedWeight?: number | string;
}

export class UpdateActivityDto {
    name?: string;
    startDate?: string | Date;
    endDate?: string | Date;
    status?: string;
    percent?: number | string;
    notes?: string;
    contractorId?: string;
    budgetLineId?: string;
}

export class AddDependencyDto {
    dependsOnActivityId: string;
}

export class CloseActivityDto {
    pmName: string;
    directorName: string;
    contractorName: string;
    notes?: string;
    // Signatures could be strings (base64) or URLs if uploaded separately
}
