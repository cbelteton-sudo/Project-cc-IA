import { Module } from '@nestjs/common';
import { DailyLogService } from './daily-log.service';
import { DailyLogController } from './daily-log.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
    controllers: [DailyLogController],
    providers: [DailyLogService, PrismaService],
})
export class DailyLogModule { }
