
import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { PMDashboardService } from './pm-dashboard.service';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { ActiveUser } from '../../common/decorators/active-user.decorator';

@Controller('pm-dashboard')
@UseGuards(JwtAuthGuard)
export class PMDashboardController {
    constructor(private readonly pmService: PMDashboardService) { }

    @Get('project/:id')
    getDashboard(@Param('id') id: string, @ActiveUser() user: any) {
        return this.pmService.getDashboardData(id, user.tenantId);
    }

    @Patch('activity/:id/block')
    blockActivity(@Param('id') id: string, @Body() body: any, @ActiveUser() user: any) {
        return this.pmService.blockActivity(id, user.tenantId, body, user.userId);
    }

    @Patch('activity/:id/commit')
    commitActivity(@Param('id') id: string, @Body() body: { date: string }, @ActiveUser() user: any) {
        return this.pmService.commitActivity(id, user.tenantId, body.date);
    }

    @Post('activity/:id/request-update')
    requestUpdate(@Param('id') id: string, @ActiveUser() user: any) {
        return this.pmService.requestUpdate(id, user.name);
    }
}
