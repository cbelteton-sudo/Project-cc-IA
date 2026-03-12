import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProjectMembersService } from './project-members.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { ProjectAuthGuard } from '../../common/guards/project-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';

@Controller('admin/projects/:projectId/members') // Note: historically 'admin', but accessible to PMs
@UseGuards(JwtAuthGuard, ProjectAuthGuard, PermissionsGuard)
export class ProjectMembersController {
  constructor(private readonly membersService: ProjectMembersService) {}

  @Post()
  @RequirePermissions(Permission.MEMBER_INVITE)
  async addMember(
    @Param('projectId') projectId: string,
    @Body() dto: AddMemberDto,
    @Req() req: any,
  ) {
    console.log('[ProjectMembersController] addMember called:', {
      projectId,
      dto,
    });
    return this.membersService.addMember(
      projectId,
      dto,
      req.user.id,
      req.user.tenantId,
    );
  }

  @Get()
  @RequirePermissions(Permission.MEMBER_VIEW)
  async getMembers(@Param('projectId') projectId: string) {
    return this.membersService.getMembers(projectId);
  }

  @Delete(':userId')
  @RequirePermissions(Permission.MEMBER_UPDATE)
  async removeMember(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    return this.membersService.removeMember(
      projectId,
      userId,
      req.user.id,
      req.user.tenantId,
    );
  }

  @Patch(':userId')
  @RequirePermissions(Permission.MEMBER_UPDATE)
  async updateMemberRole(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
    @Req() req: any,
  ) {
    console.log(
      '[ProjectMembersController] updateMemberRole received DTO:',
      dto,
    );
    return this.membersService.updateMemberRole(
      projectId,
      userId,
      dto.role,
      dto.contractorId,
      req.user.id,
      req.user.tenantId,
    );
  }
}
