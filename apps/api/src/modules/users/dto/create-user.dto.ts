export class CreateUserDto {
    email: string;
    password?: string;
    name?: string;
    tenantId: string;
    role?: string;
    contractorId?: string;
}
