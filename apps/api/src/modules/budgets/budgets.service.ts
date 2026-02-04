import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) { }

  async create(createBudgetDto: CreateBudgetDto, tenantId: string) {
    // Verify project belongs to tenant
    const project = await this.prisma.project.findUnique({
      where: { id: createBudgetDto.projectId },
    });

    if (!project || project.tenantId !== tenantId) {
      throw new BadRequestException('Invalid project');
    }

    return this.prisma.budget.create({
      data: {
        name: createBudgetDto.name || 'Budget',
        projectId: createBudgetDto.projectId,
      },
    });
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
        budgetLines: true,
      },
    });

    if (!budget || budget.project.tenantId !== tenantId) {
      throw new NotFoundException('Budget not found');
    }

    return budget;
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
    const budget = await this.findOne(id, tenantId);

    const totalPlanned = budget.budgetLines.reduce((sum: number, line: any) => sum + line.amountParam, 0);
    const totalCommitted = budget.budgetLines.reduce((sum: number, line: any) => sum + line.amountCommitted, 0);
    const totalExecuted = budget.budgetLines.reduce((sum: number, line: any) => sum + line.amountExecuted, 0);

    return {
      ...budget,
      summary: {
        totalPlanned,
        totalCommitted,
        totalExecuted,
        variance: totalPlanned - totalExecuted,
      }
    };
  }
}
