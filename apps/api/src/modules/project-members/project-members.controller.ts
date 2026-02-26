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
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@Controller('admin/projects/:projectId/members') // Adjusted route to match requirement
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN') // Only Admins can manage members via this endpoint
export class ProjectMembersController {
  constructor(private readonly membersService: ProjectMembersService) {}

  @Post()
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
  async getMembers(@Param('projectId') projectId: string) {
    return this.membersService.getMembers(projectId);
  }

  @Delete(':userId')
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
