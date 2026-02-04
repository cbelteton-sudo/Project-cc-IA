import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ChangeOrdersService } from './change-orders.service';
import { CreateChangeOrderDto } from './dto/create-change-order.dto';
import { UpdateChangeOrderDto } from './dto/update-change-order.dto';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { ActiveUser } from '../../common/decorators/active-user.decorator';

@Controller('change-orders')
@UseGuards(JwtAuthGuard)
export class ChangeOrdersController {
  constructor(private readonly changeOrdersService: ChangeOrdersService) { }

  @Post()
  create(@Body() createChangeOrderDto: CreateChangeOrderDto, @ActiveUser() user: any) {
    return this.changeOrdersService.create(createChangeOrderDto, user.tenantId);
  }

  @Get()
  findAll(@ActiveUser() user: any) {
    return this.changeOrdersService.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @ActiveUser() user: any) {
    return this.changeOrdersService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChangeOrderDto: UpdateChangeOrderDto, @ActiveUser() user: any) {
    return this.changeOrdersService.update(id, updateChangeOrderDto, user.tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @ActiveUser() user: any) {
    return this.changeOrdersService.remove(id, user.tenantId);
  }
}
