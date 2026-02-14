import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateItemDto {
  @IsNotEmpty()
  @IsString()
  activityId: string;

  @IsOptional()
  @IsNumber()
  qtyDone?: number;

  @IsOptional()
  @IsString()
  checklistState?: string; // JSON

  @IsOptional()
  @IsString()
  milestoneState?: string; // JSON

  @IsOptional()
  @IsNumber()
  manualPercent?: number;

  @IsOptional()
  @IsString()
  status?: string; // GAP FIX: Allow status update from field

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isRisk?: boolean;

  @IsOptional()
  @IsString()
  overrideJustification?: string;
}

export class CreateFieldUpdateDto {
  @IsNotEmpty()
  @IsString()
  projectId: string;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateItemDto)
  items: UpdateItemDto[];
}
