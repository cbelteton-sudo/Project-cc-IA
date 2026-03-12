import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { ActiveUser } from '../../common/decorators/active-user.decorator';
import { ProjectAuthGuard } from '../../common/guards/project-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';
import { CreateOperatorDto } from './dto/create-operator.dto';
import type { ActiveUserData } from '../../common/interfaces/active-user-data.interface';
import { ProjectDashboardOverview } from './dto/project-dashboard-overview.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // Rebuild Trigger
  @Post()
  create(
    @Body() createProjectDto: CreateProjectDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.projectsService.create(createProjectDto, user.tenantId);
  }

  @Get()
  findAll(@ActiveUser() user: ActiveUserData) {
    return this.projectsService.findAll(user.tenantId, user);
  }

  @Get(':id')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_VIEW)
  findOne(@Param('id') id: string, @ActiveUser() user: ActiveUserData) {
    return this.projectsService.findOne(id, user.tenantId);
  }

  @Get(':id/members')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_VIEW)
  getMembers(@Param('id') id: string, @ActiveUser() user: ActiveUserData) {
    return this.projectsService.getMembers(id, user.tenantId);
  }

  @Get(':id/dashboard-overview')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_VIEW)
  getDashboardOverview(
    @Param('id') id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<ProjectDashboardOverview> {
    return this.projectsService.getDashboardOverview(id, user.tenantId);
  }

  @Patch(':id')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_EDIT)
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.projectsService.update(id, updateProjectDto, user.tenantId);
  }

  @Delete(':id')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_DELETE)
  remove(@Param('id') id: string, @ActiveUser() user: ActiveUserData) {
    return this.projectsService.remove(id, user.tenantId);
  }

  @Post(':id/reorder-items')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_EDIT)
  reorderItems(
    @Param('id') id: string,
    @Body() body: { items: { id: string; type: 'ACTIVITY' | 'MILESTONE' }[] },
    @ActiveUser() user: ActiveUserData,
  ) {
    // TODO: Verify project ownership/tenant access for safety, though update queries inside service usually handle non-existent IDs gracefully or throw.
    // Ideally we check project ownership first.
    return this.projectsService.reorderItems(user.tenantId, body.items);
  }

  @Post(':projectId/operators')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  // Ensure only authorized roles can create operators (PM, ContractorLead)
  @RequirePermissions(Permission.OPERATOR_CREATE)
  createOperator(
    @Param('projectId') projectId: string,
    @Body() createOperatorDto: CreateOperatorDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.projectsService.createOperator(
      projectId,
      createOperatorDto,
      user.tenantId,
    );
  }
}
