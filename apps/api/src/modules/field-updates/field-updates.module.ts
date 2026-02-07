import { Module } from '@nestjs/common';
import { FieldUpdatesService } from './field-updates.service';
import { FieldUpdatesController } from './field-updates.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
    controllers: [FieldUpdatesController],
    providers: [FieldUpdatesService, PrismaService],
    exports: [FieldUpdatesService],
})
export class FieldUpdatesModule { }
