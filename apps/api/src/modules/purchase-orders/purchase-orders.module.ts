import { Module } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { BudgetsModule } from '../budgets/budgets.module';

@Module({
  imports: [PrismaModule, BudgetsModule],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
})
export class PurchaseOrdersModule { }
