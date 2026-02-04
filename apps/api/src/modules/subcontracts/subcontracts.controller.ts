import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SubcontractsService } from './subcontracts.service';
import { CreateSubcontractDto } from './dto/create-subcontract.dto';
import { UpdateSubcontractDto } from './dto/update-subcontract.dto';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { ActiveUser } from '../../common/decorators/active-user.decorator';

@Controller('subcontracts')
@UseGuards(JwtAuthGuard)
export class SubcontractsController {
  constructor(private readonly subcontractsService: SubcontractsService) { }

  @Post()
  create(@Body() createSubcontractDto: CreateSubcontractDto, @ActiveUser() user: any) {
    return this.subcontractsService.create(createSubcontractDto, user.tenantId);
  }

  @Get()
  findAll(@ActiveUser() user: any) {
    return this.subcontractsService.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @ActiveUser() user: any) {
    return this.subcontractsService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSubcontractDto: UpdateSubcontractDto, @ActiveUser() user: any) {
    return this.subcontractsService.update(id, updateSubcontractDto, user.tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @ActiveUser() user: any) {
    return this.subcontractsService.remove(id, user.tenantId);
  }
}
