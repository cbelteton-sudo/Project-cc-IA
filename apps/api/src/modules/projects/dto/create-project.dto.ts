import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string | Date;

  @IsOptional()
  @IsDateString()
  endDate?: string | Date;

  @IsOptional()
  @IsNumber()
  globalBudget?: number;

  @IsOptional()
  @IsBoolean()
  enablePMDashboard?: boolean;

  @IsOptional()
  @IsBoolean()
  enablePunchListPro?: boolean;

  @IsOptional()
  @IsBoolean()
  enableScrum?: boolean;

  @IsOptional()
  @IsString()
  managerName?: string;

  @IsOptional()
  @IsString()
  projectManagerId?: string;

  @IsOptional()
  @IsString()
  mainContractorId?: string;

  @IsOptional()
  @IsBoolean()
  enableBudget?: boolean;

  @IsOptional()
  @IsBoolean()
  enableFieldManagement?: boolean;

  @IsOptional()
  @IsBoolean()
  enableMaterials?: boolean;
}
