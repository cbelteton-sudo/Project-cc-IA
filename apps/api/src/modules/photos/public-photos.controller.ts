import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('uploads')
export class PublicPhotosController {
    @Get(':file')
    serveFile(@Param('file') file: string, @Res() res: Response) {
        const filePath = path.join(process.cwd(), 'uploads', file);
        if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        } else {
            return res.status(404).json({ message: 'File not found' });
        }
    }
}
