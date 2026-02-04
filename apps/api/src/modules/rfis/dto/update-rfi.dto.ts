import { PartialType } from '@nestjs/mapped-types';
import { CreateRfiDto } from './create-rfi.dto';

export class UpdateRfiDto extends PartialType(CreateRfiDto) {}
