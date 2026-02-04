import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RfqsService } from './rfqs.service';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { UpdateRfqDto } from './dto/update-rfq.dto';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { ActiveUser } from '../../common/decorators/active-user.decorator';

@Controller('rfqs')
@UseGuards(JwtAuthGuard)
export class RfqsController {
  constructor(private readonly rfqsService: RfqsService) { }

  @Post()
  create(@Body() createRfqDto: CreateRfqDto, @ActiveUser() user: any) {
    return this.rfqsService.create(createRfqDto, user.tenantId);
  }

  @Get()
  findAll(@ActiveUser() user: any) {
    return this.rfqsService.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @ActiveUser() user: any) {
    return this.rfqsService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRfqDto: UpdateRfqDto, @ActiveUser() user: any) {
    return this.rfqsService.update(id, updateRfqDto, user.tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @ActiveUser() user: any) {
    return this.rfqsService.remove(id, user.tenantId);
  }
}
