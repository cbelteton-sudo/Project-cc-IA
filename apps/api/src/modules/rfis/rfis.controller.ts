import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RfisService } from './rfis.service';
import { CreateRfiDto } from './dto/create-rfi.dto';
import { UpdateRfiDto } from './dto/update-rfi.dto';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { ActiveUser } from '../../common/decorators/active-user.decorator';

@Controller('rfis')
@UseGuards(JwtAuthGuard)
export class RfisController {
  constructor(private readonly rfisService: RfisService) { }

  @Post()
  create(@Body() createRfiDto: CreateRfiDto, @ActiveUser() user: any) {
    return this.rfisService.create(createRfiDto, user.tenantId);
  }

  @Get()
  findAll(@ActiveUser() user: any) {
    return this.rfisService.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @ActiveUser() user: any) {
    return this.rfisService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRfiDto: UpdateRfiDto, @ActiveUser() user: any) {
    return this.rfisService.update(id, updateRfiDto, user.tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @ActiveUser() user: any) {
    return this.rfisService.remove(id, user.tenantId);
  }
}
