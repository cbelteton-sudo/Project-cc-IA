import { Controller, Post, Body, Get, Param, Patch, Query } from '@nestjs/common';
import { FieldUpdatesService } from './field-updates.service';
import { CreateFieldUpdateDto } from './dto/create-field-update.dto';

@Controller('field-updates')
export class FieldUpdatesController {
    constructor(private readonly fieldUpdatesService: FieldUpdatesService) { }

    @Post('draft')
    createDraft(@Body() createFieldUpdateDto: CreateFieldUpdateDto) {
        // Logic for offline sync (handling drafts)
        return this.fieldUpdatesService.createDraft(createFieldUpdateDto);
    }

    @Get('today')
    getTodayStats(@Query('projectId') projectId: string) {
        return this.fieldUpdatesService.getTodayStats(projectId);
    }

    // Phase 9 extensibility: Submit, Approve, Reject will act on specific IDs
    @Patch(':id/submit')
    submit(@Param('id') id: string) {
        return this.fieldUpdatesService.updateStatus(id, 'SUBMITTED');
    }
}
