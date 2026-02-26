import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IssuesService } from './issues.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActiveUser } from '../../common/decorators/active-user.decorator';
import { ProjectAuthGuard } from '../../common/guards/project-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';
import { DeprecatedEndpoint } from '../../common/decorators/deprecated.decorator';

@Controller('issues')
@UseGuards(JwtAuthGuard)
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Post()
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_EDIT)
  @DeprecatedEndpoint('/field-records')
  create(@Body() createIssueDto: CreateIssueDto, @ActiveUser() user: any) {
    return this.issuesService.create(createIssueDto, user);
  }

  @Get()
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_VIEW)
  @DeprecatedEndpoint('/field-records?type=ISSUE')
  findAll(@Query('projectId') projectId: string, @ActiveUser() user: any) {
    return this.issuesService.findAll(projectId, user);
  }

  @Patch(':id')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_EDIT)
  @DeprecatedEndpoint('/field-records/:id')
  update(
    @Param('id') id: string,
    @Body() updateIssueDto: UpdateIssueDto,
    @Query('projectId') projectId: string,
    @ActiveUser() user: any,
  ) {
    return this.issuesService.update(id, updateIssueDto, user, projectId);
  }

  @Patch(':id/status')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_EDIT)
  @DeprecatedEndpoint('/field-records/:id')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Query('projectId') projectId: string,
    @ActiveUser() user: any,
  ) {
    return this.issuesService.updateStatus(id, status, user, projectId);
  }

  @Post(':id/comments')
  @UseGuards(ProjectAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROJECT_EDIT)
  @DeprecatedEndpoint('/field-records/:id')
  createComment(
    @Param('id') id: string,
    @Body('text') text: string,
    @Query('projectId') projectId: string,
    @ActiveUser() user: any,
  ) {
    return this.issuesService.createComment(id, text, user, projectId);
  }
}
