import { PartialType } from '@nestjs/mapped-types';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  ValidateIf,
} from 'class-validator';

export class CreateContractorDto {
  @IsString()
  name: string; // Commercial Name

  @IsString()
  @IsOptional()
  type?: string;

  @ValidateIf(
    (o: any) => o.email !== '' && o.email !== undefined && o.email !== null,
  )
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  taxId?: string;

  @IsString()
  @IsOptional()
  address?: string;

  // Phase 10 Extended
  @IsString()
  @IsOptional()
  legalName?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  specialties?: string;

  @IsString()
  @IsOptional()
  certifications?: string;

  @IsString()
  @IsOptional()
  insurancePolicy?: string;

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  bankAccount?: string;

  @IsString()
  @IsOptional()
  contactPersonName?: string;

  @IsString()
  @IsOptional()
  contactPersonPhone?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  projectId?: string; // Phase 9.1: Project-scoped contractors
}

export class UpdateContractorDto extends PartialType(CreateContractorDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
