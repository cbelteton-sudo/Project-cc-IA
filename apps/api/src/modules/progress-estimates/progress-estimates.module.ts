import { Module } from '@nestjs/common';
import { ProgressEstimatesService } from './progress-estimates.service';
import { ProgressEstimatesController } from './progress-estimates.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProgressEstimatesController],
  providers: [ProgressEstimatesService],
})
export class ProgressEstimatesModule { }
