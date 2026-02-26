import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ProjectRole } from '../../../common/enums/project-role.enum';

export class UpdateMemberRoleDto {
  @IsEnum(ProjectRole)
  @IsNotEmpty()
  role: ProjectRole;

  @IsOptional()
  @IsString()
  contractorId?: string;
}
