import { PartialType } from '@nestjs/mapped-types';
import { CreateBacklogItemDto } from './create-backlog-item.dto';

export class UpdateBacklogItemDto extends PartialType(CreateBacklogItemDto) {}
