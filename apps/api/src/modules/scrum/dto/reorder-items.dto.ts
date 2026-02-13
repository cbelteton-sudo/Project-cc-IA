import { IsUUID, IsArray, IsString } from 'class-validator';

export class ReorderItemsDto {
  @IsUUID()
  sprintId: string;

  @IsArray()
  @IsString({ each: true })
  orderedIds: string[];
}
