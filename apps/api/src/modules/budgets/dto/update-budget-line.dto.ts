import { PartialType } from '@nestjs/mapped-types';
import { CreateBudgetLineDto } from './create-budget-line.dto';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateBudgetLineDto extends PartialType(CreateBudgetLineDto) {
    @IsNumber()
    @IsOptional()
    budgetCO?: number;

    @IsNumber()
    @IsOptional()
    budgetTransfer?: number;
}
