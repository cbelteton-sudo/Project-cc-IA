import { PartialType } from '@nestjs/mapped-types';
import { CreateChangeOrderDto } from './create-change-order.dto';

export class UpdateChangeOrderDto extends PartialType(CreateChangeOrderDto) {}
