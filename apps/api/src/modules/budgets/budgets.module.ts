import { Module } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { BudgetsController } from './budgets.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { LedgerService } from './ledger.service';

@Module({
  imports: [PrismaModule],
  controllers: [BudgetsController],
  providers: [BudgetsService, LedgerService],
  exports: [BudgetsService, LedgerService],
})
export class BudgetsModule { }
