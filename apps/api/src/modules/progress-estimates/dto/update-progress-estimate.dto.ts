import { PartialType } from '@nestjs/mapped-types';
import { CreateProgressEstimateDto } from './create-progress-estimate.dto';

export class UpdateProgressEstimateDto extends PartialType(CreateProgressEstimateDto) {}
