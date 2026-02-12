import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateChangeOrderItemDto {
    @IsString()
    @IsNotEmpty()
    budgetLineId: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsNumber()
    amount: number;
}

export class CreateChangeOrderDto {
    @IsString()
    @IsNotEmpty()
    projectId: string;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateChangeOrderItemDto)
    items: CreateChangeOrderItemDto[];
}
