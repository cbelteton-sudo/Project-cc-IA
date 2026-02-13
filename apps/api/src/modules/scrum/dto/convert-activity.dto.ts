import { IsUUID } from 'class-validator';

export class ConvertActivityDto {
  @IsUUID()
  activityId: string;

  @IsUUID()
  projectId: string;
}
