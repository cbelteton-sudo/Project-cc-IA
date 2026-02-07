import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';

export class CreateIssueDto {
    @IsNotEmpty()
    @IsString()
    projectId: string;

    @IsOptional()
    @IsString()
    activityId?: string;

    @IsNotEmpty()
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(['HIGH', 'MEDIUM', 'LOW'])
    severity?: string;

    @IsOptional()
    @IsString()
    ownerUserId?: string;

    @IsOptional()
    @IsDateString()
    dueDate?: string;
}
