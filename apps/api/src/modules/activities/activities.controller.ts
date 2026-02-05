import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto, UpdateActivityDto, AddDependencyDto } from './dto/create-activity.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActiveUser } from '../../common/decorators/active-user.decorator';

@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
    constructor(private readonly activitiesService: ActivitiesService) { }

    @Post()
    create(@ActiveUser('tenantId') tenantId: string, @Body() createActivityDto: CreateActivityDto) {
        return this.activitiesService.create(tenantId, createActivityDto);
    }

    @Get('project/:projectId')
    findAllByProject(@ActiveUser('tenantId') tenantId: string, @Param('projectId') projectId: string) {
        return this.activitiesService.findAllByProject(tenantId, projectId);
    }

    @Get(':id')
    findOne(@ActiveUser('tenantId') tenantId: string, @Param('id') id: string) {
        return this.activitiesService.findOne(tenantId, id);
    }

    @Patch(':id')
    update(@ActiveUser('tenantId') tenantId: string, @Param('id') id: string, @Body() updateActivityDto: UpdateActivityDto) {
        return this.activitiesService.update(tenantId, id, updateActivityDto);
    }

    @Post(':id/dependencies')
    addDependency(@ActiveUser('tenantId') tenantId: string, @Param('id') id: string, @Body() dto: AddDependencyDto) {
        return this.activitiesService.addDependency(tenantId, id, dto);
    }
}
