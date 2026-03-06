import { IsString, IsOptional } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;
}
