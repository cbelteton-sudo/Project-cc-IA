import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsObject,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FieldRecordContentDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  severity?: string;

  @IsString()
  @IsOptional()
  scheduleActivityId?: string;

  @IsString()
  @IsOptional()
  activityName?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsNumber()
  @IsOptional()
  progressChip?: number;

  @IsString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsOptional()
  items?: any[];

  // Also allowing arbitrary index signatures
  [key: string]: unknown;
}

export class CreateFieldRecordDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => FieldRecordContentDto)
  @IsNotEmpty()
  content: FieldRecordContentDto;
}

export class SyncFieldRecordItemContentDto {
  @IsString()
  @IsOptional()
  scheduleActivityId?: string;

  @IsNumber()
  @IsOptional()
  progressChip?: number;

  @IsString()
  @IsOptional()
  note?: string;

  [key: string]: unknown;
}

export class SyncFieldRecordItemDto {
  @IsString()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsOptional()
  activityId?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsNumber()
  @IsOptional()
  manualPercent?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => SyncFieldRecordItemContentDto)
  content?: SyncFieldRecordItemContentDto;
}

export class SyncFieldRecordsDto {
  @IsString()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsOptional()
  date?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SyncFieldRecordItemDto)
  records?: SyncFieldRecordItemDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SyncFieldRecordItemDto)
  items?: SyncFieldRecordItemDto[];
}
