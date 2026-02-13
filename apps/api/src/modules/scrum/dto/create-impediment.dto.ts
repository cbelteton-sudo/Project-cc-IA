import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsUUID,
  Min,
  Max,
} from 'class-validator';

export enum ImpedimentStatus {
  OPEN = 'OPEN',
  MITIGATING = 'MITIGATING',
  RESOLVED = 'RESOLVED',
}

export class CreateImpedimentDto {
  @IsString()
  projectId: string;

  @IsUUID()
  @IsOptional()
  sprintId?: string;

  @IsUUID()
  @IsOptional()
  backlogItemId?: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  @Max(4)
  @IsOptional()
  severity?: number; // 1-4

  @IsEnum(ImpedimentStatus)
  @IsOptional()
  status?: string;

  @IsUUID()
  @IsOptional()
  ownerUserId?: string;
}
