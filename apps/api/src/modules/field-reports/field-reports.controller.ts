import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { FieldReportsService } from './field-reports.service';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { ActiveUser } from '../../common/decorators/active-user.decorator';

@Controller('field/reports')
@UseGuards(JwtAuthGuard)
export class FieldReportsController {
    constructor(private readonly fieldReportsService: FieldReportsService) { }

    @Get('today')
    getToday(@Query('projectId') projectId: string, @ActiveUser() user: any) {
        return this.fieldReportsService.getTodayReport(projectId, user.userId);
    }

    @Post('entries')
    upsertEntry(@Body() dto: any) {
        return this.fieldReportsService.upsertEntry(dto);
    }

    @Patch(':id/submit')
    submitReport(@Param('id') id: string, @ActiveUser() user: any) {
        return this.fieldReportsService.submitReport(id, user.userId);
    }

    @Get(':id/pdf')
    generatePdf(@Param('id') id: string) {
        return this.fieldReportsService.generatePdf(id);
    }
}
