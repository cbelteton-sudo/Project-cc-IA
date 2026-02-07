import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PhotosService {
    private readonly logger = new Logger(PhotosService.name);
    private readonly uploadDir = './uploads';

    constructor(private prisma: PrismaService) {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async processAndSave(
        file: Express.Multer.File,
        userId: string,
        metadata: { projectId: string; activityId?: string; fieldUpdateId?: string }
    ) {
        const fileId = uuidv4();
        const filenameBase = `${metadata.projectId}_${fileId}`;

        // Paths
        const mainPath = path.join(this.uploadDir, `${filenameBase}_main.webp`);
        const thumbPath = path.join(this.uploadDir, `${filenameBase}_thumb.webp`);

        // Process Main Image
        const mainBuffer = await sharp(file.buffer)
            .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .withMetadata({ density: undefined }) // Strip metadata
            .toBuffer();

        fs.writeFileSync(mainPath, mainBuffer);

        // Process Thumbnail
        const thumbBuffer = await sharp(file.buffer)
            .resize(480, 480, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 70 })
            .withMetadata({ density: undefined })
            .toBuffer();

        fs.writeFileSync(thumbPath, thumbBuffer);

        // Get Dimensions & Hash
        const mainMeta = await sharp(mainBuffer).metadata();

        // Save to DB
        const photo = await this.prisma.photo.create({
            data: {
                projectId: metadata.projectId,
                activityId: metadata.activityId,
                fieldUpdateId: metadata.fieldUpdateId,
                urlMain: `/uploads/${filenameBase}_main.webp`,
                urlThumb: `/uploads/${filenameBase}_thumb.webp`,
                width: mainMeta.width,
                height: mainMeta.height,
                sizeBytes: mainBuffer.length,
                createdBy: userId,
                capturedAt: new Date() // Ideally parsed from original EXIF before stripping, but MVP
            }
        });

        return photo;
    }
}
