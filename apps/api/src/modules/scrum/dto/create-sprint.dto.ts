import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsUUID,
} from 'class-validator';

export enum SprintStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export class CreateSprintDto {
  @IsString()
  projectId: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  goal?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsEnum(SprintStatus)
  @IsOptional()
  status?: string;

  @IsUUID()
  createdByUserId: string;
}
