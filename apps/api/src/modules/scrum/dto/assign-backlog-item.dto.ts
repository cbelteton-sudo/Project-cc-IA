import { IsUUID, IsOptional, IsEnum } from 'class-validator';

export class AssignBacklogItemDto {
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsEnum(['USER', 'CONTRACTOR_RESOURCE'])
  assigneeType?: 'USER' | 'CONTRACTOR_RESOURCE';
}
