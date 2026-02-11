import { Module } from '@nestjs/common';
import { ScrumController } from './scrum.controller';
import { ScrumService } from './scrum.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ScrumController],
    providers: [ScrumService],
    exports: [ScrumService],
})
export class ScrumModule { }
