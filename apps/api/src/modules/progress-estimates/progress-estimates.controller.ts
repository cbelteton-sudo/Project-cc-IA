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
import { ProgressEstimatesService } from './progress-estimates.service';
import { CreateProgressEstimateDto } from './dto/create-progress-estimate.dto';
import { UpdateProgressEstimateDto } from './dto/update-progress-estimate.dto';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { ProjectAuthGuard } from '../../common/guards/project-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';
import { ActiveUser } from '../../common/decorators/active-user.decorator';

@Controller('progress-estimates')
@UseGuards(JwtAuthGuard)
export class ProgressEstimatesController {
  constructor(
    private readonly progressEstimatesService: ProgressEstimatesService,
  ) {}

  @Post()
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_EDIT)
  create(
    @Body() createProgressEstimateDto: CreateProgressEstimateDto,
    @Query('projectId') projectId: string,
    @ActiveUser() user: any,
  ) {
    return this.progressEstimatesService.create(
      createProgressEstimateDto,
      user,
      projectId,
    );
  }

  @Get()
  // Data isolation applies inside findAll
  findAll(@ActiveUser() user: any) {
    return this.progressEstimatesService.findAll(user);
  }

  @Get(':id')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_VIEW)
  findOne(
    @Param('id') id: string,
    @Query('projectId') projectId: string,
    @ActiveUser() user: any,
  ) {
    return this.progressEstimatesService.findOne(id, user, projectId);
  }

  @Patch(':id')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_EDIT)
  update(
    @Param('id') id: string,
    @Body() updateProgressEstimateDto: UpdateProgressEstimateDto,
    @Query('projectId') projectId: string,
    @ActiveUser() user: any,
  ) {
    return this.progressEstimatesService.update(
      id,
      updateProgressEstimateDto,
      user,
      projectId,
    );
  }

  @Delete(':id')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_DELETE)
  remove(
    @Param('id') id: string,
    @Query('projectId') projectId: string,
    @ActiveUser() user: any,
  ) {
    return this.progressEstimatesService.remove(id, user, projectId);
  }
}
