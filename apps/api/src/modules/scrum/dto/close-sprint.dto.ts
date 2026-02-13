import { IsString, IsOptional } from 'class-validator';

export class CloseSprintDto {
  @IsString()
  @IsOptional()
  keep?: string;

  @IsString()
  @IsOptional()
  improve?: string;

  @IsString()
  @IsOptional()
  stop?: string;
}
