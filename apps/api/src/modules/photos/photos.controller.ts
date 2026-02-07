import { Controller, Post, UseInterceptors, UploadedFile, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PhotosService } from './photos.service';

@Controller('photos')
export class PhotosController {
    constructor(private readonly photosService: PhotosService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: any // projectId, activityId, fieldUpdateId
    ) {
        // In a real app, userId comes from request context (AuthGuard)
        const userId = "SYSTEM_TEST";
        return this.photosService.processAndSave(file, userId, {
            projectId: body.projectId,
            activityId: body.activityId,
            fieldUpdateId: body.fieldUpdateId
        });
    }
}
