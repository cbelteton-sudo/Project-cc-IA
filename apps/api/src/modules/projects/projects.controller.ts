import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { ActiveUser } from '../../common/decorators/active-user.decorator';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) { }

  // Rebuild Trigger
  @Post()
  create(@Body() createProjectDto: CreateProjectDto, @ActiveUser() user: any) {
    return this.projectsService.create(createProjectDto, user.tenantId);
  }

  @Get()
  findAll(@ActiveUser() user: any) {
    return this.projectsService.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @ActiveUser() user: any) {
    return this.projectsService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto, @ActiveUser() user: any) {
    return this.projectsService.update(id, updateProjectDto, user.tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @ActiveUser() user: any) {
    return this.projectsService.remove(id, user.tenantId);
  }

  @Post(':id/reorder-items')
  reorderItems(
    @Param('id') id: string,
    @Body() body: { items: { id: string; type: 'ACTIVITY' | 'MILESTONE' }[] },
    @ActiveUser() user: any
  ) {
    // TODO: Verify project ownership/tenant access for safety, though update queries inside service usually handle non-existent IDs gracefully or throw.
    // Ideally we check project ownership first.
    return this.projectsService.reorderItems(user.tenantId, body.items);
  }
}
