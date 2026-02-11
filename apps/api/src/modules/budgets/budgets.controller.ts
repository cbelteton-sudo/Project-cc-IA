import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { CreateBudgetLineDto } from './dto/create-budget-line.dto';
import { UpdateBudgetLineDto } from './dto/update-budget-line.dto';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { ActiveUser } from '../../common/decorators/active-user.decorator';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) { }

  @Post()
  async create(@Body() createBudgetDto: CreateBudgetDto, @Req() req: any) {
    console.log('BudgetsController.create - Body:', createBudgetDto);
    // Fallback: extract user manually if decorator fails
    const user = req.user;

    if (!user || !user.tenantId) {
      console.error('User/Tenant missing in Request:', user);
      throw new BadRequestException('User context invalid or missing tenantId');
    }

    try {
      return await this.budgetsService.create(createBudgetDto, user.tenantId);
    } catch (e) {
      console.error('Controller Catch:', e);
      throw e; // Filter will catch this now
    }
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

  // --- Lines ---

  @Post(':budgetId/lines')
  @Post(':budgetId/lines')
  async createLine(@Param('budgetId') budgetId: string, @Body() createBudgetLineDto: CreateBudgetLineDto) {
    console.log('BudgetsController.createLine - BudgetID:', budgetId, 'Body:', createBudgetLineDto);
    try {
      return await this.budgetsService.createLine(budgetId, createBudgetLineDto);
    } catch (e) {
      console.error('Controller createLine Catch:', e);
      throw e;
    }
  }

  @Patch('lines/:id')
  updateLine(@Param('id') id: string, @Body() updateBudgetLineDto: UpdateBudgetLineDto) {
    return this.budgetsService.updateLine(id, updateBudgetLineDto);
  }

  @Delete('lines/:id')
  deleteLine(@Param('id') id: string) {
    return this.budgetsService.deleteLine(id);
  }
}
