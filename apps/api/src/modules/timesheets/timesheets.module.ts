import { Module } from '@nestjs/common';
import { TimesheetsService } from './timesheets.service';
import { TimesheetsController } from './timesheets.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { BudgetsModule } from '../budgets/budgets.module';

@Module({
    imports: [PrismaModule, BudgetsModule],
    controllers: [TimesheetsController],
    providers: [TimesheetsService],
    exports: [TimesheetsService],
})
export class TimesheetsModule { }
