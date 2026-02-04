import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { ActiveUser } from '../../common/decorators/active-user.decorator';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) { }

  @Post()
  create(@Body() createBudgetDto: CreateBudgetDto, @ActiveUser() user: any) {
    return this.budgetsService.create(createBudgetDto, user.tenantId);
  }

  @Get()
  findAll(@ActiveUser() user: any) {
    return this.budgetsService.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @ActiveUser() user: any) {
    return this.budgetsService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBudgetDto: UpdateBudgetDto, @ActiveUser() user: any) {
    return this.budgetsService.update(id, updateBudgetDto, user.tenantId);
  }

  @Get(':id/summary')
  getSummary(@Param('id') id: string, @ActiveUser() user: any) {
    return this.budgetsService.getSummary(id, user.tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @ActiveUser() user: any) {
    return this.budgetsService.remove(id, user.tenantId);
  }
}
