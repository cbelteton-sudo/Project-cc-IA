import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { ActiveUser } from '../../common/decorators/active-user.decorator';

@Controller('purchase-orders')
@UseGuards(JwtAuthGuard)
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) { }

  @Post()
  create(@Body() createPurchaseOrderDto: CreatePurchaseOrderDto, @ActiveUser() user: any) {
    return this.purchaseOrdersService.create(createPurchaseOrderDto, user.tenantId);
  }

  @Get()
  findAll(@ActiveUser() user: any) {
    return this.purchaseOrdersService.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @ActiveUser() user: any) {
    return this.purchaseOrdersService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePurchaseOrderDto: UpdatePurchaseOrderDto, @ActiveUser() user: any) {
    return this.purchaseOrdersService.update(id, updatePurchaseOrderDto, user.tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @ActiveUser() user: any) {
    return this.purchaseOrdersService.remove(id, user.tenantId);
  }
}
