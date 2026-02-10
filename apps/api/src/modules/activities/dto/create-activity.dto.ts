import { IsString, IsOptional, IsDateString, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateActivityDto {
    @IsString()
    @IsNotEmpty()
    projectId: string;

    @IsOptional()
    @IsString()
    parentId?: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    code?: string;

    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @IsDateString()
    @IsNotEmpty()
    endDate: string;

    @IsOptional()
    @IsString()
    contractorId?: string;

    @IsOptional()
    plannedWeight?: number | string; // Handled as string/number safely in service
}

export class UpdateActivityDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    percent?: number | string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsString()
    contractorId?: string;

    @IsOptional()
    @IsString()
    budgetLineId?: string;
}

export class AddDependencyDto {
    @IsString()
    @IsNotEmpty()
    dependsOnActivityId: string;
}

export class CloseActivityDto {
    @IsString()
    @IsNotEmpty()
    pmName: string;

    @IsString()
    @IsNotEmpty()
    directorName: string;

    @IsString()
    @IsNotEmpty()
    contractorName: string;

    @IsOptional()
    @IsString()
    notes?: string;
}
