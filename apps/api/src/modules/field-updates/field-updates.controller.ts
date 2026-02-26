import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FieldUpdatesService } from './field-updates.service';
import { CreateFieldUpdateDto } from './dto/create-field-update.dto';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { DeprecatedEndpoint } from '../../common/decorators/deprecated.decorator';

@Controller('__deprecated__field-updates') // Deprecated in favor of field/reports/sync-draft
@UseGuards(JwtAuthGuard)
export class FieldUpdatesController {
  constructor(private readonly fieldUpdatesService: FieldUpdatesService) {}

  @Post('draft')
  @DeprecatedEndpoint('/field-records/sync')
  createDraft(@Body() createFieldUpdateDto: CreateFieldUpdateDto) {
    // Logic for offline sync (handling drafts)
    return this.fieldUpdatesService.createDraft(createFieldUpdateDto);
  }

  @Get('today')
  @DeprecatedEndpoint('/field-records?type=DAILY_ENTRY')
  getTodayStats(@Query('projectId') projectId: string) {
    return this.fieldUpdatesService.getTodayStats(projectId);
  }

  // Phase 9 extensibility: Submit, Approve, Reject will act on specific IDs
  @Patch(':id/submit')
  @DeprecatedEndpoint('/field-records/:id')
  submit(@Param('id') id: string) {
    return this.fieldUpdatesService.updateStatus(id, 'SUBMITTED');
  }
}
