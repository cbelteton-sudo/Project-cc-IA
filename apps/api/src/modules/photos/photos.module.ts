import { Module } from '@nestjs/common';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
    controllers: [PhotosController],
    providers: [PhotosService, PrismaService],
    exports: [PhotosService],
})
export class PhotosModule { }
