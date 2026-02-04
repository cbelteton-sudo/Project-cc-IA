import { PartialType } from '@nestjs/mapped-types';
import { CreateSubcontractDto } from './create-subcontract.dto';

export class UpdateSubcontractDto extends PartialType(CreateSubcontractDto) {}
