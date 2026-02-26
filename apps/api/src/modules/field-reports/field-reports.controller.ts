import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FieldReportsService } from './field-reports.service';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { ProjectAuthGuard } from '../../common/guards/project-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';
import { ActiveUser } from '../../common/decorators/active-user.decorator';
import { DeprecatedEndpoint } from '../../common/decorators/deprecated.decorator';

@Controller('field/reports')
@UseGuards(JwtAuthGuard)
export class FieldReportsController {
  constructor(private readonly fieldReportsService: FieldReportsService) {}

  @Get('today')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_VIEW)
  @DeprecatedEndpoint('/field-records?type=DAILY_ENTRY')
  getToday(@Query('projectId') projectId: string, @ActiveUser() user: any) {
    return this.fieldReportsService.getTodayReport(projectId, user);
  }

  @Post('entries')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_EDIT)
  upsertEntry(@Body() dto: any, @ActiveUser() user: any) {
    return this.fieldReportsService.upsertEntry(dto, user);
  }

  @Patch(':id/submit')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_EDIT)
  submitReport(
    @Param('id') id: string,
    @Query('projectId') projectId: string,
    @ActiveUser() user: any,
  ) {
    return this.fieldReportsService.submitReport(id, user, projectId);
  }

  @Post('sync-draft')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_EDIT)
  @DeprecatedEndpoint('/field-records/sync')
  syncDraft(@Body() dto: any, @ActiveUser() user: any) {
    // Unifies field-updates offline draft behavior into field-reports
    return this.fieldReportsService.syncDraft(dto, user);
  }

  @Get(':id/pdf')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_VIEW)
  generatePdf(
    @Param('id') id: string,
    @Query('projectId') projectId: string,
    @ActiveUser() user: any,
  ) {
    return this.fieldReportsService.generatePdf(id, user, projectId);
  }

  @Get('pm/dashboard')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_VIEW)
  getPMDashboardMetrics(
    @Query('projectId') projectId: string,
    @ActiveUser() user: any,
  ) {
    return this.fieldReportsService.getPMDashboardMetrics(projectId, user);
  }

  @Get('activities/:id/log')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_VIEW)
  getActivityLog(
    @Param('id') id: string,
    @Query('projectId') projectId: string,
    @ActiveUser() user: any,
  ) {
    return this.fieldReportsService.getActivityLog(id, user, projectId);
  }
}
