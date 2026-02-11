import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { CreateBudgetLineDto } from './dto/create-budget-line.dto';
import { UpdateBudgetLineDto } from './dto/update-budget-line.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { LedgerService } from './ledger.service';

@Injectable()
export class BudgetsService {
  constructor(
    private prisma: PrismaService,
    private ledger: LedgerService,
  ) { }

  async create(createBudgetDto: CreateBudgetDto, tenantId: string) {
    console.log('Creating Budget:', createBudgetDto, 'Tenant:', tenantId);

    if (!createBudgetDto.projectId) {
      throw new BadRequestException('Project ID is required');
    }

    try {
      // Verify project belongs to tenant
      const project = await this.prisma.project.findUnique({
        where: { id: createBudgetDto.projectId },
      });

      console.log('Found Project:', project ? project.id : 'NOT FOUND');

      if (!project || project.tenantId !== tenantId) {
        console.error('Invalid Project or Tenant mismatch');
        throw new BadRequestException('Invalid project');
      }

      const budget = await this.prisma.budget.create({
        data: {
          name: createBudgetDto.name || 'Budget',
          projectId: createBudgetDto.projectId,
        },
      });
      console.log('Budget Created:', budget);
      return budget;
    } catch (error) {
      console.error('Error creating budget:', error);
      throw new InternalServerErrorException(`Failed to create budget: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findAll(tenantId: string) {
    return this.prisma.budget.findMany({
      where: {
        project: {
          tenantId: tenantId,
        },
      },
      include: {
        project: true,
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      include: {
        project: true,
        budgetLines: {
          include: { wbsActivity: true }
        },
      },
    });

    if (!budget || budget.project.tenantId !== tenantId) {
      throw new NotFoundException('Budget not found');
    }

    // Enrich with Real-time Ledger Data
    const enrichedLines = await Promise.all(budget.budgetLines.map(async (line) => {
      const costs = await this.ledger.getAggregatedCosts(budget.projectId, line.wbsActivityId!, line.costType);
      return {
        ...line,
        amountCommitted: costs.committed,
        amountExecuted: costs.actual,
        variance: (line.budgetBase + line.budgetCO + line.budgetTransfer) - (costs.committed + costs.actual) // Budget - Actual/Committed? Or (Budget - Actual). Usually Variance = Budget - (Committed + Actual) is "Remaining Budget"
      };
    }));

    return { ...budget, budgetLines: enrichedLines };
  }

  async update(id: string, updateBudgetDto: UpdateBudgetDto, tenantId: string) {
    await this.findOne(id, tenantId); // validate ownership

    return this.prisma.budget.update({
      where: { id },
      data: updateBudgetDto,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId); // validate ownership

    return this.prisma.budget.delete({
      where: { id },
    });
  }

  async getSummary(id: string, tenantId: string) {
    const budget = await this.findOne(id, tenantId); // uses enriched findOne now? 
    // Wait, typical findOne call above returns object with enriched lines.

    // Calculate totals from enriched lines
    const totalPlanned = budget.budgetLines.reduce((sum: number, line: any) => sum + (line.budgetBase || 0) + (line.budgetCO || 0) + (line.budgetTransfer || 0), 0);
    const totalCommitted = budget.budgetLines.reduce((sum: number, line: any) => sum + (line.amountCommitted || 0), 0);
    const totalExecuted = budget.budgetLines.reduce((sum: number, line: any) => sum + (line.amountExecuted || 0), 0);

    return {
      ...budget,
      summary: {
        totalPlanned,
        totalCommitted,
        totalExecuted,
        variance: totalPlanned - (totalCommitted + totalExecuted),
      }
    };
  }

  // --- Budget Line Management ---

  async createLine(budgetId: string, dto: CreateBudgetLineDto) {
    // Validation? We assume user has access if they can reach here (Controller should verify)
    // But we should verify budget exists
    const budget = await this.prisma.budget.findUnique({ where: { id: budgetId } });
    if (!budget) throw new NotFoundException('Budget not found');

    return this.prisma.budgetLine.create({
      data: {
        budgetId,
        wbsActivityId: dto.wbsActivityId,
        costType: dto.costType,
        code: dto.code || '',
        name: dto.name,
        budgetBase: dto.budgetBase || 0,
      }
    });
  }

  async updateLine(id: string, dto: UpdateBudgetLineDto) {
    return this.prisma.budgetLine.update({
      where: { id },
      data: dto,
    });
  }

  async deleteLine(id: string) {
    return this.prisma.budgetLine.delete({ where: { id } });
  }
}
