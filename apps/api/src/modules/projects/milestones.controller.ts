import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { MilestonesService } from './milestones.service';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { ActiveUser } from '../../common/decorators/active-user.decorator';

@Controller('projects/:projectId/milestones')
@UseGuards(JwtAuthGuard)
export class MilestonesController {
    constructor(private readonly milestonesService: MilestonesService) { }

    @Post()
    create(
        @ActiveUser('tenantId') tenantId: string,
        @Param('projectId') projectId: string,
        @Body() dto: any
    ) {
        return this.milestonesService.create(tenantId, projectId, dto);
    }

    @Get()
    findAll(
        @ActiveUser('tenantId') tenantId: string,
        @Param('projectId') projectId: string
    ) {
        return this.milestonesService.findAll(tenantId, projectId);
    }

    @Post('reorder')
    reorder(
        @ActiveUser('tenantId') tenantId: string,
        @Body() body: { orderedIds: string[] }
    ) {
        return this.milestonesService.reorder(tenantId, body.orderedIds);
    }

    @Patch(':id')
    update(
        @ActiveUser('tenantId') tenantId: string,
        @Param('id') id: string,
        @Body() dto: any
    ) {
        return this.milestonesService.update(tenantId, id, dto);
    }

    @Delete(':id')
    remove(
        @ActiveUser('tenantId') tenantId: string,
        @Param('id') id: string
    ) {
        return this.milestonesService.remove(tenantId, id);
    }
}
