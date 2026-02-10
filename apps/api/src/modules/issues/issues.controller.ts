import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActiveUser } from '../../common/decorators/active-user.decorator';

@Controller('issues')
@UseGuards(JwtAuthGuard)
export class IssuesController {
    constructor(private readonly issuesService: IssuesService) { }

    @Post()
    create(@Body() createIssueDto: CreateIssueDto, @ActiveUser('id') userId: string) {
        return this.issuesService.create(createIssueDto, userId);
    }

    @Get()
    findAll(@Query('projectId') projectId: string) {
        return this.issuesService.findAll(projectId);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateIssueDto: UpdateIssueDto, @ActiveUser('id') userId: string) {
        return this.issuesService.update(id, updateIssueDto, userId);
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.issuesService.updateStatus(id, status);
    }

    @Post(':id/comments')
    createComment(@Param('id') id: string, @Body('text') text: string, @ActiveUser('id') userId: string) {
        return this.issuesService.createComment(id, text, userId);
    }
}
