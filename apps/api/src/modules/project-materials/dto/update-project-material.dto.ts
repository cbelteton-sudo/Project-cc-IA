import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectMaterialDto } from './create-project-material.dto';

export class UpdateProjectMaterialDto extends PartialType(
  CreateProjectMaterialDto,
) {}
