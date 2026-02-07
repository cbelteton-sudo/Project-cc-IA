import { Module } from '@nestjs/common';
import { FieldReportsService } from './field-reports.service';
import { FieldReportsController } from './field-reports.controller';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
    controllers: [FieldReportsController],
    providers: [FieldReportsService, PrismaService],
})
export class FieldReportsModule { }
