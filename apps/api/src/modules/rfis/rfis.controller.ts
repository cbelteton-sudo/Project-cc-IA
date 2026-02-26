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
import { RfisService } from './rfis.service';
import { CreateRfiDto } from './dto/create-rfi.dto';
import { UpdateRfiDto } from './dto/update-rfi.dto';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { ProjectAuthGuard } from '../../common/guards/project-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';
import { ActiveUser } from '../../common/decorators/active-user.decorator';
import { DeprecatedEndpoint } from '../../common/decorators/deprecated.decorator';

@Controller('rfis')
@UseGuards(JwtAuthGuard)
export class RfisController {
  constructor(private readonly rfisService: RfisService) {}

  @Post()
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_EDIT)
  @DeprecatedEndpoint('/field-records')
  create(
    @Body() createRfiDto: CreateRfiDto,
    @Query('projectId') projectId: string,
    @ActiveUser() user: any,
  ) {
    return this.rfisService.create(createRfiDto, user, projectId);
  }

  @Get()
  @DeprecatedEndpoint('/field-records?type=RFI')
  findAll(@ActiveUser() user: any) {
    return this.rfisService.findAll(user);
  }

  @Get(':id')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_VIEW)
  @DeprecatedEndpoint('/field-records/:id')
  findOne(
    @Param('id') id: string,
    @Query('projectId') projectId: string,
    @ActiveUser() user: any,
  ) {
    return this.rfisService.findOne(id, user, projectId);
  }

  @Patch(':id')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_EDIT)
  @DeprecatedEndpoint('/field-records/:id')
  update(
    @Param('id') id: string,
    @Body() updateRfiDto: UpdateRfiDto,
    @Query('projectId') projectId: string,
    @ActiveUser() user: any,
  ) {
    return this.rfisService.update(id, updateRfiDto, user, projectId);
  }

  @Delete(':id')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_DELETE)
  @DeprecatedEndpoint('/field-records/:id')
  remove(
    @Param('id') id: string,
    @Query('projectId') projectId: string,
    @ActiveUser() user: any,
  ) {
    return this.rfisService.remove(id, user, projectId);
  }
}
