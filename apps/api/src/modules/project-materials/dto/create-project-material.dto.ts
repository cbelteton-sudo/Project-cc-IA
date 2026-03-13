import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateProjectMaterialDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  materialId: string;

  @IsString()
  @IsOptional()
  projectSKU?: string;

  @IsNumber()
  @IsOptional()
  plannedQty?: number;

  @IsNumber()
  @IsOptional()
  plannedPrice?: number;

  @IsNumber()
  @IsOptional()
  stockAvailable?: number;

  @IsNumber()
  @IsOptional()
  stockConsumed?: number;

  @IsString()
  @IsOptional()
  costCenter?: string;
}
