import { PartialType } from '@nestjs/mapped-types';
import { CreateIssueDto } from './create-issue.dto';
import { IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';

export class UpdateIssueDto extends PartialType(CreateIssueDto) {
    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    validationNote?: string;
}
