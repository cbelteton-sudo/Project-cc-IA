import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateBudgetDto {
    @IsString()
    @IsNotEmpty()
    projectId: string;

    @IsString()
    @IsOptional()
    name?: string;
}
