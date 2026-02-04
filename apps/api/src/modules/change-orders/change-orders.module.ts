import { Module } from '@nestjs/common';
import { ChangeOrdersService } from './change-orders.service';
import { ChangeOrdersController } from './change-orders.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChangeOrdersController],
  providers: [ChangeOrdersService],
})
export class ChangeOrdersModule { }
