import { Module } from '@nestjs/common';
import { FieldRecordsController } from './field-records.controller';
import { FieldRecordsService } from './field-records.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { IssuesModule } from '../issues/issues.module';
import { FieldReportsModule } from '../field-reports/field-reports.module';
import { InspectionsModule } from '../inspections/inspections.module';
import { MaterialRequestsModule } from '../material-requests/material-requests.module';

@Module({
  imports: [
    PrismaModule,
    IssuesModule,
    FieldReportsModule,
    InspectionsModule,
    MaterialRequestsModule,
  ],
  controllers: [FieldRecordsController],
  providers: [FieldRecordsService],
  exports: [FieldRecordsService],
})
export class FieldRecordsModule {}
