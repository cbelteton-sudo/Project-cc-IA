import { PartialType } from '@nestjs/mapped-types';
import { CreateRfqDto } from './create-rfq.dto';

export class UpdateRfqDto extends PartialType(CreateRfqDto) {}
