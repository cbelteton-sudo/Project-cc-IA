import { IsArray, IsUUID } from 'class-validator';

export class AddSprintItemsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  items: string[];
}
