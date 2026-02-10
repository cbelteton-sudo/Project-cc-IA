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
    @IsEnum(['HIGH', 'MEDIUM', 'LOW', 'CRITICAL'])
    severity?: string;

    @IsOptional()
    @IsString()
    ownerUserId?: string;

    @IsOptional()
    @IsDateString()
    dueDate?: string;

    // Punch List Pro Fields
    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsString()
    trade?: string;

    @IsOptional()
    @IsString()
    locationBuilding?: string;

    @IsOptional()
    @IsString()
    locationLevel?: string;

    @IsOptional()
    @IsString()
    locationZone?: string;

    @IsOptional()
    @IsString()
    contractorId?: string;
}
