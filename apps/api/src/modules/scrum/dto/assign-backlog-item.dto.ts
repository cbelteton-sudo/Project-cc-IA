import { IsUUID } from 'class-validator';

export class AssignBacklogItemDto {
  @IsUUID()
  userId: string;
}
