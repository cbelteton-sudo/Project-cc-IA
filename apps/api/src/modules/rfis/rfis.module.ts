import { Module } from '@nestjs/common';
import { RfisService } from './rfis.service';
import { RfisController } from './rfis.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RfisController],
  providers: [RfisService],
})
export class RfisModule { }
