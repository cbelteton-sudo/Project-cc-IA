import { Module } from '@nestjs/common';
import { MaterialRequestsService } from './material-requests.service';
import { MaterialRequestsController } from './material-requests.controller';
import { WhatsappController } from './whatsapp.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MaterialRequestsController, WhatsappController],
  providers: [MaterialRequestsService],
})
export class MaterialRequestsModule { }
