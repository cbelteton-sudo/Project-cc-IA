import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateMaterialDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsNumber()
  costParam: number;
}
