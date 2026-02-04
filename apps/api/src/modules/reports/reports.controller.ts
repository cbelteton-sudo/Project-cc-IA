import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { ActiveUser } from '../../common/decorators/active-user.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @Get('dashboard')
  getDashboard(@ActiveUser() user: any) {
    return this.reportsService.getDashboardStats(user.tenantId);
  }

  @Get('project/:id')
  getProjectReport(@Param('id') id: string, @ActiveUser() user: any) {
    return this.reportsService.getProjectReport(id, user.tenantId);
  }
}
