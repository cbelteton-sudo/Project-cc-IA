import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { DailyLogService } from './daily-log.service';
import type { Response } from 'express';

@Controller('daily-log')
export class DailyLogController {
    constructor(private readonly dailyLogService: DailyLogService) { }

    @Get(':date')
    async getDailyLog(@Param('date') date: string, @Query('projectId') projectId: string) {
        return this.dailyLogService.getDailyLog(projectId, date);
    }

    @Get(':date/pdf')
    async downloadPdf(
        @Param('date') date: string,
        @Query('projectId') projectId: string,
        @Res() res: Response
    ) {
        const buffer = await this.dailyLogService.generatePdf(projectId, date);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=daily-log-${date}.pdf`,
            'Content-Length': buffer.length,
        });

        res.end(buffer);
    }
}
