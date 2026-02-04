import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { MaterialRequestsService } from './material-requests.service';
import { CreateMaterialRequestDto } from './dto/create-material-request.dto';
import { UpdateMaterialRequestDto } from './dto/update-material-request.dto';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { ActiveUser } from '../../common/decorators/active-user.decorator';

@Controller('material-requests')
@UseGuards(JwtAuthGuard)
export class MaterialRequestsController {
  constructor(private readonly materialRequestsService: MaterialRequestsService) { }

  @Post()
  create(@Body() createMaterialRequestDto: CreateMaterialRequestDto, @ActiveUser() user: any) {
    return this.materialRequestsService.create(createMaterialRequestDto, user.tenantId);
  }

  @Get()
  findAll(@ActiveUser() user: any) {
    return this.materialRequestsService.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @ActiveUser() user: any) {
    return this.materialRequestsService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMaterialRequestDto: UpdateMaterialRequestDto, @ActiveUser() user: any) {
    return this.materialRequestsService.update(id, updateMaterialRequestDto, user.tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @ActiveUser() user: any) {
    return this.materialRequestsService.remove(id, user.tenantId);
  }
}
