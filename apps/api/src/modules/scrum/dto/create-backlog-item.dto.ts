import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsNumber,
  IsUUID,
} from 'class-validator';

export enum BacklogItemType {
  EPIC = 'EPIC',
  STORY = 'STORY',
  TASK = 'TASK',
  BUG = 'BUG',
  RISK = 'RISK',
}

export enum BacklogItemStatus {
  BACKLOG = 'BACKLOG',
  READY = 'READY',
  IN_SPRINT = 'IN_SPRINT', // Though board status is managed via SprintItem
  DONE = 'DONE',
  BLOCKED = 'BLOCKED',
}

export class CreateBacklogItemDto {
  @IsString()
  projectId: string; // Sometimes inferred from URL, but good to have in body if needed

  @IsEnum(BacklogItemType)
  type: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(BacklogItemStatus)
  @IsOptional()
  status?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  priority?: number;

  @IsString()
  @IsOptional()
  discipline?: string;

  @IsUUID()
  @IsOptional()
  assigneeUserId?: string;

  @IsUUID()
  @IsOptional()
  contractorId?: string;

  @IsUUID()
  @IsOptional()
  linkedWbsActivityId?: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsUUID()
  @IsOptional()
  sprintId?: string;

  @IsInt()
  @IsOptional()
  storyPoints?: number;

  @IsNumber()
  @IsOptional()
  estimatedHours?: number;

  @IsString()
  @IsOptional()
  definitionOfDone?: string;

  @IsString()
  @IsOptional()
  evidenceRequired?: string;

  @IsString()
  @IsOptional()
  dueDate?: string; // ISO Date string
}
