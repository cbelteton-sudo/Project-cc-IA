import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  MinLength,
  IsBoolean,
} from 'class-validator';

export class CreateScrumProjectDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  contractorId?: string;

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

  @IsOptional()
  @IsString()
  methodology?: 'SCRUM' | 'KANBAN' = 'SCRUM';

  @IsOptional()
  @IsBoolean()
  enableBudget?: boolean;

  @IsOptional()
  @IsBoolean()
  enableFieldManagement?: boolean;
}
