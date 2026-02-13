import { IsString, IsOptional, IsUUID, IsArray } from 'class-validator';

export class CreateDailyUpdateDto {
  @IsString()
  projectId: string;

  @IsUUID()
  userId: string;

  @IsUUID()
  @IsOptional()
  sprintId?: string;

  @IsUUID()
  @IsOptional()
  backlogItemId?: string;

  @IsUUID()
  @IsOptional()
  wbsActivityId?: string;

  @IsString()
  text: string;

  @IsString()
  @IsOptional()
  blocker?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photoIds?: string[];
}
