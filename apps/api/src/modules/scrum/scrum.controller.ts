import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ScrumService } from './scrum.service';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { ActiveUser } from '../../common/decorators/active-user.decorator';

import { CreateScrumProjectDto } from './dto/create-scrum-project.dto';
import { CreateBacklogItemDto } from './dto/create-backlog-item.dto';
import { UpdateBacklogItemDto } from './dto/update-backlog-item.dto';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { AddSprintItemsDto } from './dto/add-sprint-items.dto';
import { CloseSprintDto } from './dto/close-sprint.dto';
import { UpdateItemStatusDto } from './dto/update-item-status.dto';
import { ReorderItemsDto } from './dto/reorder-items.dto';
import { CreateDailyUpdateDto } from './dto/create-daily-update.dto';
import { CreateImpedimentDto } from './dto/create-impediment.dto';
import { AssignBacklogItemDto } from './dto/assign-backlog-item.dto';
import { ConvertActivityDto } from './dto/convert-activity.dto';

@Controller('scrum')
@UseGuards(JwtAuthGuard)
export class ScrumController {
  constructor(private readonly scrumService: ScrumService) {}

  @Post('projects')
  createProject(@Body() data: CreateScrumProjectDto, @ActiveUser() user: any) {
    return this.scrumService.createProject({
      ...data,
      tenantId: user.tenantId,
    });
  }

  @Get('projects/:projectId/dashboard')
  getDashboardMetrics(@Param('projectId') projectId: string) {
    return this.scrumService.getDashboardMetrics(projectId);
  }

  @Get('projects/:projectId/eisenhower')
  getEisenhowerMatrix(@Param('projectId') projectId: string) {
    return this.scrumService.getEisenhowerMatrix(projectId);
  }

  @Patch('backlog/:id/eisenhower')
  updateEisenhowerStatus(
    @Param('id') id: string,
    @Body() body: { isUrgent: boolean; isImportant: boolean },
  ) {
    return this.scrumService.updateEisenhowerStatus(
      id,
      body.isUrgent,
      body.isImportant,
    );
  }

  @Post('backlog')
  createBacklogItem(@Body() data: CreateBacklogItemDto) {
    return this.scrumService.createBacklogItem(data);
  }

  @Get('backlog/:projectId')
  getBacklog(@Param('projectId') projectId: string) {
    return this.scrumService.getBacklog(projectId);
  }

  @Post('backlog/convert')
  convertActivity(@Body() body: ConvertActivityDto) {
    return this.scrumService.convertWbsActivityToBacklog(
      body.activityId,
      body.projectId,
    );
  }

  @Patch('backlog/:id')
  updateBacklogItem(
    @Param('id') id: string,
    @Body() data: UpdateBacklogItemDto,
  ) {
    return this.scrumService.updateBacklogItem(id, data);
  }

  @Patch('backlog/:id/assign')
  assignBacklogItem(
    @Param('id') id: string,
    @Body() body: AssignBacklogItemDto,
  ) {
    return this.scrumService.assignBacklogItem(id, body.userId);
  }

  @Post('sprints')
  createSprint(@Body() data: CreateSprintDto) {
    return this.scrumService.createSprint(data);
  }

  @Get('sprints/:projectId')
  getSprints(@Param('projectId') projectId: string) {
    return this.scrumService.getSprints(projectId);
  }

  @Post('sprints/:sprintId/items')
  addItemsToSprint(
    @Param('sprintId') sprintId: string,
    @Body() body: AddSprintItemsDto,
  ) {
    return this.scrumService.addItemsToSprint(sprintId, body.items);
  }

  @Patch('sprints/:sprintId/start')
  startSprint(@Param('sprintId') sprintId: string) {
    return this.scrumService.startSprint(sprintId);
  }

  @Patch('sprints/:sprintId/close')
  closeSprint(
    @Param('sprintId') sprintId: string,
    @Body() body: CloseSprintDto,
  ) {
    return this.scrumService.closeSprint(sprintId, body);
  }

  @Patch('items/:itemId/status')
  updateItemStatus(
    @Param('itemId') itemId: string,
    @Body() body: UpdateItemStatusDto,
  ) {
    return this.scrumService.updateSprintItemStatus(itemId, body.status);
  }

  @Post('items/reorder')
  reorderItems(@Body() body: ReorderItemsDto) {
    return this.scrumService.reorderSprintItems(body.sprintId, body.orderedIds);
  }

  @Post('daily-updates')
  createDailyUpdate(@Body() data: CreateDailyUpdateDto) {
    return this.scrumService.createDailyUpdate(data);
  }

  @Get('daily-updates/:projectId')
  getDailyUpdates(
    @Param('projectId') projectId: string,
    @Query('sprintId') sprintId?: string,
    @Query('backlogItemId') backlogItemId?: string,
  ) {
    return this.scrumService.getDailyUpdates(
      projectId,
      sprintId,
      backlogItemId,
    );
  }

  @Post('impediments')
  createImpediment(@Body() data: CreateImpedimentDto) {
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
