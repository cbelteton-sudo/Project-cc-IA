import { IsString, IsOptional, IsEmail, IsBoolean } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateContractorResourceDto {
  @IsString()
  name: string;

  @IsString()
  role: string; // CREW, OPERATOR, INSTALLER, SUPERVISOR

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateContractorResourceDto extends PartialType(
  CreateContractorResourceDto,
) {}
