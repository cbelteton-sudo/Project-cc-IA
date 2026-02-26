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
import { MaterialRequestsService } from './material-requests.service';
import { CreateMaterialRequestDto } from './dto/create-material-request.dto';
import { UpdateMaterialRequestDto } from './dto/update-material-request.dto';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { ProjectAuthGuard } from '../../common/guards/project-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ActiveUser } from '../../common/decorators/active-user.decorator';
import { Permission } from '../../common/constants/permissions';
import { DeprecatedEndpoint } from '../../common/decorators/deprecated.decorator';

@Controller('material-requests')
@UseGuards(JwtAuthGuard, ProjectAuthGuard, PermissionsGuard)
export class MaterialRequestsController {
  constructor(
    private readonly materialRequestsService: MaterialRequestsService,
  ) {}

  @Post()
  @RequirePermissions(Permission.PROJECT_EDIT)
  @DeprecatedEndpoint('/field-records')
  create(
    @Body() createMaterialRequestDto: CreateMaterialRequestDto,
    @ActiveUser() user: any,
  ) {
    return this.materialRequestsService.create(createMaterialRequestDto, user);
  }

  @Get()
  @RequirePermissions(Permission.PROJECT_VIEW)
  @DeprecatedEndpoint('/field-records?type=MATERIAL_REQUEST')
  findAll(@Query('projectId') projectId: string, @ActiveUser() user: any) {
    return this.materialRequestsService.findAll(projectId, user);
  }

  @Get(':id')
  @RequirePermissions(Permission.PROJECT_VIEW)
  @DeprecatedEndpoint('/field-records/:id')
  findOne(
    @Param('id') id: string,
    @Query('projectId') projectId: string,
    @ActiveUser() user: any,
  ) {
    return this.materialRequestsService.findOne(id, projectId, user);
  }

  @Patch(':id')
  @RequirePermissions(Permission.PROJECT_EDIT)
  @DeprecatedEndpoint('/field-records/:id')
  update(
    @Param('id') id: string,
    @Body() updateMaterialRequestDto: UpdateMaterialRequestDto,
    @Query('projectId') projectId: string,
    @ActiveUser() user: any,
  ) {
    return this.materialRequestsService.update(
      id,
      updateMaterialRequestDto,
      projectId,
      user,
    );
  }

  @Delete(':id')
  @RequirePermissions(Permission.PROJECT_DELETE)
  @DeprecatedEndpoint('/field-records/:id')
  remove(
    @Param('id') id: string,
    @Query('projectId') projectId: string,
    @ActiveUser() user: any,
  ) {
    return this.materialRequestsService.remove(id, projectId, user);
  }
}
