import { PartialType } from '@nestjs/mapped-types';
import { CreateMaterialRequestDto } from './create-material-request.dto';

export class UpdateMaterialRequestDto extends PartialType(CreateMaterialRequestDto) {}
