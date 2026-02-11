import { IsString, IsNumber, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';

export class CreateBudgetLineDto {
    @IsString()
    @IsOptional()
    projectId?: string; // Optional as we might infer it or not use it directly here if budgetId is enough

    @IsString()
    @IsOptional()
    wbsActivityId?: string;

    @IsString()
    @IsNotEmpty()
    @IsEnum(['MATERIAL', 'LABOR', 'SUB', 'EQUIPMENT', 'OVERHEAD'])
    costType: string;

    @IsString()
    @IsOptional()
    code?: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @IsOptional()
    budgetBase?: number;
}
