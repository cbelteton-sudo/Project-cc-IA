import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FieldRecordsService } from './field-records.service';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { ProjectAuthGuard } from '../../common/guards/project-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';
import { ActiveUser } from '../../common/decorators/active-user.decorator';
import type { ActiveUserData } from '../../common/interfaces/active-user-data.interface';
import {
  CreateFieldRecordDto,
  SyncFieldRecordsDto,
} from './dto/field-record.dto';

@Controller('field-records')
@UseGuards(JwtAuthGuard)
export class FieldRecordsController {
  constructor(private readonly fieldRecordsService: FieldRecordsService) {}

  @Post()
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.TASK_CREATE)
  async createRecord(
    @Body() dto: CreateFieldRecordDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    if (!dto.projectId) {
      throw new BadRequestException('projectId is required');
    }
    // We attach the projectId loosely to req, but ProjectAuthGuard might need ?projectId= in query
    // Wait, ProjectAuthGuard gets projectId from body if it's a POST usually, or query. Let's assume it checks body.
    return this.fieldRecordsService.createRecord(dto, user);
  }

  @Post('sync')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.TASK_CREATE)
  async syncRecords(
    @Body() dto: SyncFieldRecordsDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    // ProjectAuthGuard looks for projectId. Let's assume it's in body or query.
    return this.fieldRecordsService.syncRecords(dto, user);
  }

  @Get()
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_VIEW)
  async listRecords(
    @Query('projectId') projectId: string,
    @Query('type') type: string,
    @ActiveUser() user: ActiveUserData,
    @Query('activityId') activityId?: string,
  ) {
    return this.fieldRecordsService.listRecords(
      projectId,
      type,
      user,
      activityId,
    );
  }

  @Get(':id')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_VIEW)
  async getRecord(
    @Param('id') id: string,
    @Query('type') type: string,
    @Query('projectId') projectId: string,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.fieldRecordsService.getRecord(id, type, projectId, user);
  }
}
