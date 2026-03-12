import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ProjectMaterialsService } from './project-materials.service';
import { CreateProjectMaterialDto } from './dto/create-project-material.dto';
import { UpdateProjectMaterialDto } from './dto/update-project-material.dto';
import { ReceiveProjectMaterialDto } from './dto/receive-project-material.dto';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ActiveUser } from '../../common/decorators/active-user.decorator';

@Controller('project-materials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectMaterialsController {
  constructor(
    private readonly projectMaterialsService: ProjectMaterialsService,
  ) {}

  @Post()
  create(@Body() createProjectMaterialDto: CreateProjectMaterialDto) {
    return this.projectMaterialsService.create(createProjectMaterialDto);
  }

  @Get()
  findAll(@Query('projectId') projectId: string) {
    return this.projectMaterialsService.findAllByProject(projectId);
  }

  @Get('financial-variance')
  @Roles('ADMIN', 'ADMINISTRADOR', 'DIRECTOR', 'PM', 'PROJECT_MANAGER')
  getFinancialVariance(@Query('projectId') projectId: string) {
    return this.projectMaterialsService.getFinancialVarianceReport(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectMaterialsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProjectMaterialDto: UpdateProjectMaterialDto,
  ) {
    return this.projectMaterialsService.update(id, updateProjectMaterialDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectMaterialsService.remove(id);
  }

  @Post(':id/receive')
  receive(
    @Param('id') id: string,
    @Body() receiveProjectMaterialDto: ReceiveProjectMaterialDto,
    @ActiveUser('id') userId: string,
  ) {
    return this.projectMaterialsService.receiveMaterial(
      id,
      receiveProjectMaterialDto,
      userId,
    );
  }

  @Get(':id/kardex')
  getKardex(@Param('id') id: string) {
    return this.projectMaterialsService.getKardex(id);
  }
}
