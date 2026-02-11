import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { TimesheetsService } from './timesheets.service';
import { CreateTimesheetDto } from './dto/create-timesheet.dto';

@Controller('timesheets')
export class TimesheetsController {
    constructor(private readonly timesheetsService: TimesheetsService) { }

    @Post()
    async create(@Body() createTimesheetDto: CreateTimesheetDto) {
        console.log('TimesheetsController.create Payload:', JSON.stringify(createTimesheetDto));
        try {
            return await this.timesheetsService.create(createTimesheetDto);
        } catch (error) {
            console.error('TimesheetsController.create Error:', error);
            throw error;
        }
    }

    @Get()
    findAll(@Query('projectId') projectId: string) {
        return this.timesheetsService.findAllByProject(projectId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.timesheetsService.findOne(id);
    }

    @Post(':id/entries')
    upsertEntry(
        @Param('id') id: string,
        @Body() body: { date: string; wbsActivityId: string; hours: number }
    ) {
        return this.timesheetsService.upsertEntry(id, body);
    }
}
