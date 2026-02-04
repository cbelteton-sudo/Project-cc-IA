import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProgressEstimatesService } from './progress-estimates.service';
import { CreateProgressEstimateDto } from './dto/create-progress-estimate.dto';
import { UpdateProgressEstimateDto } from './dto/update-progress-estimate.dto';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { ActiveUser } from '../../common/decorators/active-user.decorator';

@Controller('progress-estimates')
@UseGuards(JwtAuthGuard)
export class ProgressEstimatesController {
  constructor(private readonly progressEstimatesService: ProgressEstimatesService) { }

  @Post()
  create(@Body() createProgressEstimateDto: CreateProgressEstimateDto, @ActiveUser() user: any) {
    return this.progressEstimatesService.create(createProgressEstimateDto, user.tenantId);
  }

  @Get()
  findAll(@ActiveUser() user: any) {
    return this.progressEstimatesService.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @ActiveUser() user: any) {
    return this.progressEstimatesService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProgressEstimateDto: UpdateProgressEstimateDto, @ActiveUser() user: any) {
    return this.progressEstimatesService.update(id, updateProgressEstimateDto, user.tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @ActiveUser() user: any) {
    return this.progressEstimatesService.remove(id, user.tenantId);
  }
}
