import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { DailyLogService } from './daily-log.service';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { ProjectAuthGuard } from '../../common/guards/project-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';
import { ActiveUser } from '../../common/decorators/active-user.decorator';
import { DeprecatedEndpoint } from '../../common/decorators/deprecated.decorator';

@Controller('daily-log')
@UseGuards(JwtAuthGuard, ProjectAuthGuard, PermissionsGuard)
export class DailyLogController {
  constructor(private readonly dailyLogService: DailyLogService) {}

  @Get(':date')
  @RequirePermissions(Permission.PROJECT_VIEW)
  @DeprecatedEndpoint('/field-records?type=DAILY_ENTRY')
  async getDailyLog(
    @Param('date') date: string,
    @Query('projectId') projectId: string,
    @ActiveUser() user: any,
  ) {
    return this.dailyLogService.getDailyLog(projectId, date, user.tenantId);
  }

  @Get(':date/pdf')
  @RequirePermissions(Permission.PROJECT_VIEW)
  @DeprecatedEndpoint('/field-records?type=DAILY_ENTRY')
  async downloadPdf(
    @Param('date') date: string,
    @Query('projectId') projectId: string,
    @ActiveUser() user: any,
    @Res() res: Response,
  ) {
    const buffer = await this.dailyLogService.generatePdf(
      projectId,
      date,
      user.tenantId,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=daily-log-${date}.pdf`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
