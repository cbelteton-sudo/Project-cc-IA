import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { CreateIssueDto } from './dto/create-issue.dto';

@Controller('issues')
export class IssuesController {
    constructor(private readonly issuesService: IssuesService) { }

    @Post()
    create(@Body() createIssueDto: CreateIssueDto) {
        return this.issuesService.create(createIssueDto);
    }

    @Get()
    findAll(@Query('projectId') projectId: string) {
        return this.issuesService.findAll(projectId);
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.issuesService.updateStatus(id, status);
    }
}
