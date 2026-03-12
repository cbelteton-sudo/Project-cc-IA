import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';

export class AddActivityMaterialDto {
  @IsString()
  projectMaterialId: string;

  @IsNumber()
  @Min(0.01)
  quantityConsumed: number;

  @IsOptional()
  @IsDateString()
  dateConsumed?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
