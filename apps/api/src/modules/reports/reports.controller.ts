import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { ActiveUser } from '../../common/decorators/active-user.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @Get('dashboard')
  getDashboard(@ActiveUser() user: any, @Query('period') period?: string) {
    return this.reportsService.getDashboardStats(user.tenantId, period);
  }

  @Get('project/:id')
  getProjectReport(@Param('id') id: string, @ActiveUser() user: any) {
    return this.reportsService.getProjectReport(id, user.tenantId);
  }
}
