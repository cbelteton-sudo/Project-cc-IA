import { PartialType } from '@nestjs/mapped-types';

export class CreateContractorDto {
    name: string; // Commercial Name
    type?: string;
    email?: string;
    phone?: string;
    taxId?: string;
    address?: string;

    // Phase 10 Extended
    legalName?: string;
    website?: string;
    specialties?: string;
    certifications?: string;
    insurancePolicy?: string;
    bankName?: string;
    bankAccount?: string;
    contactPersonName?: string;
    contactPersonPhone?: string;
    notes?: string;
}

export class UpdateContractorDto extends PartialType(CreateContractorDto) {
    isActive?: boolean;
}
