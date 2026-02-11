import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ScrumService } from './scrum.service';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Assuming Auth Guard exists and is global or should be imported

@Controller('scrum')
export class ScrumController {
    constructor(private readonly scrumService: ScrumService) { }

    @Post('backlog')
    createBacklogItem(@Body() data: any) {
        return this.scrumService.createBacklogItem(data);
    }

    @Get('backlog/:projectId')
    getBacklog(@Param('projectId') projectId: string) {
        return this.scrumService.getBacklog(projectId);
    }

    @Post('backlog/convert')
    convertActivity(@Body() body: { activityId: string, projectId: string }) {
        return this.scrumService.convertWbsActivityToBacklog(body.activityId, body.projectId);
    }

    @Patch('backlog/:id')
    updateBacklogItem(@Param('id') id: string, @Body() data: any) {
        return this.scrumService.updateBacklogItem(id, data);
    }

    @Patch('backlog/:id/assign')
    assignBacklogItem(@Param('id') id: string, @Body() body: { userId: string }) {
        return this.scrumService.assignBacklogItem(id, body.userId);
    }

    @Post('sprints')
    createSprint(@Body() data: any) {
        return this.scrumService.createSprint(data);
    }

    @Get('sprints/:projectId')
    getSprints(@Param('projectId') projectId: string) {
        return this.scrumService.getSprints(projectId);
    }

    @Post('sprints/:sprintId/items')
    addItemsToSprint(@Param('sprintId') sprintId: string, @Body() body: { items: string[] }) {
        return this.scrumService.addItemsToSprint(sprintId, body.items);
    }

    @Patch('sprints/:sprintId/start')
    startSprint(@Param('sprintId') sprintId: string) {
        return this.scrumService.startSprint(sprintId);
    }

    @Patch('sprints/:sprintId/close')
    closeSprint(@Param('sprintId') sprintId: string, @Body() body: { keep?: string, improve?: string, stop?: string }) {
        return this.scrumService.closeSprint(sprintId, body);
    }

    @Patch('items/:itemId/status')
    updateItemStatus(@Param('itemId') itemId: string, @Body() body: { status: string }) {
        return this.scrumService.updateSprintItemStatus(itemId, body.status);
    }

    @Post('items/reorder')
    reorderItems(@Body() body: { sprintId: string, orderedIds: string[] }) {
        return this.scrumService.reorderSprintItems(body.sprintId, body.orderedIds);
    }

    @Post('daily-updates')
    createDailyUpdate(@Body() data: any) {
        return this.scrumService.createDailyUpdate(data);
    }

    @Get('daily-updates/:projectId')
    getDailyUpdates(@Param('projectId') projectId: string, @Query('sprintId') sprintId?: string, @Query('backlogItemId') backlogItemId?: string) {
        return this.scrumService.getDailyUpdates(projectId, sprintId, backlogItemId);
    }

    @Post('impediments')
    createImpediment(@Body() data: any) {
        return this.scrumService.createImpediment(data);
    }

    @Get('impediments/:projectId')
    getImpediments(@Param('projectId') projectId: string) {
        return this.scrumService.getImpediments(projectId);
    }

    @Patch('impediments/:id/resolve')
    resolveImpediment(@Param('id') id: string) {
        return this.scrumService.resolveImpediment(id);
    }
}
