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
import { InspectionsService } from './inspections.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { ProjectAuthGuard } from '../../common/guards/project-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';
import { ActiveUser } from '../../common/decorators/active-user.decorator';
import { DeprecatedEndpoint } from '../../common/decorators/deprecated.decorator';

@Controller('inspections')
@UseGuards(JwtAuthGuard)
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Post()
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_EDIT) // Fallback to view, or maybe PROJECT_EDIT but VIEW is safer for basic creation if not specifically defined. Actually, let's use PROJECT_EDIT
  @DeprecatedEndpoint('/field-records')
  create(
    @Body() createInspectionDto: CreateInspectionDto,
    @ActiveUser() user: any,
  ) {
    return this.inspectionsService.create(createInspectionDto, user);
  }

  @Get()
  // No ProjectAuthGuard here to allow cross-project lists (scoped by service)
  @DeprecatedEndpoint('/field-records?type=INSPECTION')
  findAll(@ActiveUser() user: any) {
    return this.inspectionsService.findAll(user);
  }

  @Get(':id')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_VIEW)
  findOne(
    @Param('id') id: string,
    @Query('projectId') projectId: string,
    @ActiveUser() user: any,
  ) {
    return this.inspectionsService.findOne(id, user, projectId);
  }

  @Patch(':id')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_EDIT)
  update(
    @Param('id') id: string,
    @Body() updateInspectionDto: UpdateInspectionDto,
    @Query('projectId') projectId: string,
    @ActiveUser() user: any,
  ) {
    return this.inspectionsService.update(
      id,
      updateInspectionDto,
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
    return this.inspectionsService.remove(id, user, projectId);
  }
}
