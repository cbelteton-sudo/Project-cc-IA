import { Module } from '@nestjs/common';
import { SubcontractsService } from './subcontracts.service';
import { SubcontractsController } from './subcontracts.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SubcontractsController],
  providers: [SubcontractsService],
})
export class SubcontractsModule { }
