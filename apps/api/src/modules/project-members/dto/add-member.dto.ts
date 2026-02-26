import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ProjectRole } from '../../../common/enums/project-role.enum';

export class AddMemberDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  contractorId?: string;

  @IsEnum(ProjectRole)
  @IsNotEmpty()
  role: ProjectRole;
}
