export class CreateContractorDto {
    name: string;
    type?: string; // CONTRACTOR | SUPPLIER
    email?: string;
    phone?: string;
    taxId?: string;
    address?: string;
}

export class UpdateContractorDto {
    name?: string;
    type?: string;
    email?: string;
    phone?: string;
    taxId?: string;
    address?: string;
    isActive?: boolean;
}
