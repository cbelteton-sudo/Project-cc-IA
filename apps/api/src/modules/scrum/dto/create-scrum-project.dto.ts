import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  MinLength,
} from 'class-validator';

export class CreateScrumProjectDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  estimatedBudget?: number;
}
