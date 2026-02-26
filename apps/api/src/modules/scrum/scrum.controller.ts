import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ScrumService } from './scrum.service';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { ActiveUser } from '../../common/decorators/active-user.decorator';
import { ProjectRole } from '../../common/constants/roles';
import { Permission } from '../../common/constants/permissions';
import { ProjectAuthGuard } from '../../common/guards/project-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import type { ActiveUserData } from '../../common/interfaces/active-user-data.interface';

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
  createProject(
    @Body() data: CreateScrumProjectDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.scrumService.createProject({
      ...data,
      tenantId: user.tenantId,
      ownerUserId: user.userId || user.id,
    });
  }

  @Get('projects/:projectId/dashboard')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_VIEW)
  getDashboardMetrics(@Param('projectId') projectId: string) {
    return this.scrumService.getDashboardMetrics(projectId);
  }

  @Get('projects/:projectId/eisenhower')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.TASK_VIEW)
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
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.TASK_VIEW)
  getBacklog(
    @Param('projectId') projectId: string,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.scrumService.getBacklog(projectId, user?.id);
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
  createSprint(
    @Body() data: CreateSprintDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.scrumService.createSprint({
      ...data,
      createdByUserId: user.userId || user.id,
    });
  }

  @Get('sprints/:projectId')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.TASK_VIEW)
  getSprints(
    @Param('projectId') projectId: string,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.scrumService.getSprints(projectId, user.id);
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
  async updateItemStatus(
    @Param('itemId') itemId: string,
    @Body() body: UpdateItemStatusDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    const { member } = await this.scrumService.getSprintItemContext(
      itemId,
      user.userId || user.id,
    );

    // ABAC Rule: Field Operator can only mark DonePendingApproval
    if ((member.role as ProjectRole) === ProjectRole.FIELD_OPERATOR) {
      if (body.status === 'DONE') {
        throw new ForbiddenException(
          'Field Operators cannot mark items as DONE. Use DONE_PENDING_APPROVAL.',
        );
      }
    }

    // ABAC Rule: Executive Viewer is Read Only
    if ((member.role as ProjectRole) === ProjectRole.EXECUTIVE_VIEWER) {
      throw new ForbiddenException('Executive Viewers cannot update items.');
    }

    return this.scrumService.updateSprintItemStatus(itemId, body.status);
  }

  @Post('items/reorder')
  reorderItems(@Body() body: ReorderItemsDto) {
    return this.scrumService.reorderSprintItems(body.sprintId, body.orderedIds);
  }

  @Post('daily-updates')
  createDailyUpdate(
    @Body() data: CreateDailyUpdateDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.scrumService.createDailyUpdate({
      ...data,
      userId: user.userId || user.id,
    });
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
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.TASK_VIEW)
  getImpediments(@Param('projectId') projectId: string) {
    return this.scrumService.getImpediments(projectId);
  }

  @Patch('impediments/:id/resolve')
  resolveImpediment(@Param('id') id: string) {
    return this.scrumService.resolveImpediment(id);
  }
}
