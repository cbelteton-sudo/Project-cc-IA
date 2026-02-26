export class CreateUserDto {
  email?: string; // Optional for Field Operators
  username?: string; // Optional for Standard Users
  password?: string;
  name?: string;
  tenantId: string;
  role?: string;
  contractorId?: string;
  status?: string; // e.g. 'INVITED', 'ACTIVE'
}
