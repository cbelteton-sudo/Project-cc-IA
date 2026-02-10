import { IsArray, IsString } from 'class-validator';

export class ReorderActivitiesDto {
    @IsArray()
    @IsString({ each: true })
    orderedIds: string[];
}
