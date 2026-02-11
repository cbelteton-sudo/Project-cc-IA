import { IsString, IsNotEmpty, IsDateString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class TimesheetEntryDto {
    @IsString()
    @IsNotEmpty()
    wbsActivityId: string;

    @IsDateString()
    date: string;

    @IsOptional()
    hours: number;
}

export class CreateTimesheetDto {
    @IsString()
    @IsNotEmpty()
    projectId: string;

    @IsDateString()
    weekStartDate: string;

    @IsOptional()
    @IsString()
    workerName?: string;

    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TimesheetEntryDto)
    entries?: TimesheetEntryDto[];
}
