import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { enforceProjectScopeWhere } from '../../common/database/prisma-scope.helper';
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
    user: any,
    metadata: {
      projectId: string;
      activityId?: string;
      fieldUpdateId?: string;
    },
  ) {
    // SECURITY: Verify project access and tenant bound
    const project = await this.prisma.project.findUnique({
      where: enforceProjectScopeWhere(
        user,
        { id: metadata.projectId },
        metadata.projectId,
      ),
    });
    if (!project)
      throw new NotFoundException('Project not found or access denied');

    const fileId = uuidv4();
    const isPdf = file.mimetype === 'application/pdf';
    const ext = isPdf ? '.pdf' : '.webp';
    const filenameBase = `${metadata.projectId}_${fileId}`;

    // Paths
    const mainPath = path.join(this.uploadDir, `${filenameBase}_main${ext}`);
    const thumbPath = path.join(this.uploadDir, `${filenameBase}_thumb${ext}`);

    let mainBuffer = file.buffer;
    let width = 0;
    let height = 0;

    if (!isPdf) {
      // Process Main Image
      mainBuffer = await sharp(file.buffer)
        .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .withMetadata({ density: undefined }) // Strip metadata
        .toBuffer();

      // Process Thumbnail
      const thumbBuffer = await sharp(file.buffer)
        .resize(480, 480, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 70 })
        .withMetadata({ density: undefined })
        .toBuffer();

      fs.writeFileSync(thumbPath, thumbBuffer);

      // Get Dimensions
      const mainMeta = await sharp(mainBuffer).metadata();
      width = mainMeta.width || 0;
      height = mainMeta.height || 0;
    }

    // Save main file (both PDF and image)
    fs.writeFileSync(mainPath, mainBuffer);

    // Save to DB
    const photo = await this.prisma.photo.create({
      data: {
        projectId: metadata.projectId,
        activityId: metadata.activityId,
        fieldUpdateId: metadata.fieldUpdateId,
        urlMain: `/uploads/${filenameBase}_main${ext}`,
        urlThumb: isPdf ? null : `/uploads/${filenameBase}_thumb${ext}`,
        width: width,
        height: height,
        sizeBytes: mainBuffer.length,
        createdBy: user.id,
        capturedAt: new Date(), // Ideally parsed from original EXIF before stripping, but MVP
      },
    });

    return photo;
  }
}
