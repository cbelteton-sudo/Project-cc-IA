import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) { }

  async getDashboardStats(tenantId: string) {
    const prisma = this.prisma as any;

    // 1. Projects Stats
    const totalProjects = await prisma.project.count({ where: { tenantId } });
    const activeProjects = await prisma.project.count({ where: { tenantId, status: 'ACTIVE' } });

    // 2. Financials (Aggregated across all projects)
    const projects = await prisma.project.findMany({
      where: { tenantId },
      include: {
        budgets: {
          include: { budgetLines: true }
        }
      }
    });

    let totalBudget = 0;
    let totalExecuted = 0; // Invoiced

    projects.forEach((p: any) => {
      p.budgets.forEach((b: any) => {
        b.budgetLines.forEach((l: any) => {
          totalBudget += l.amountParam || 0;
          totalExecuted += l.amountExecuted || 0;
        });
      });
    });

    // 3. Pending Actions
    const pendingPOs = await prisma.purchaseOrder.count({ where: { project: { tenantId }, status: 'DRAFT' } });
    const pendingRequests = await prisma.materialRequest.count({ where: { project: { tenantId }, status: 'DRAFT' } });
    const pendingInvoices = await prisma.invoice.count({ where: { project: { tenantId }, status: 'PENDING' } });
    const openRFIs = await prisma.rFI.count({ where: { project: { tenantId }, status: 'OPEN' } });

    return {
      projects: {
        total: totalProjects,
        active: activeProjects
      },
      financials: {
        totalBudget,
        totalExecuted,
        variance: totalBudget - totalExecuted
      },
      pendingActions: {
        purchaseOrders: pendingPOs,
        materialRequests: pendingRequests,
        invoices: pendingInvoices,
        rfis: openRFIs
      }
    };
  }

  async getProjectReport(projectId: string, tenantId: string) {
    const prisma = this.prisma as any;
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        budgets: {
          include: { budgetLines: true }
        }
      }
    });

    if (!project || project.tenantId !== tenantId) {
      throw new NotFoundException('Project not found');
    }

    // Detailed breakdown by Budget Line
    const lines = [];
    let totalBudget = 0;
    let totalCommitted = 0;
    let totalExecuted = 0;

    project.budgets.forEach((b: any) => {
      b.budgetLines.forEach((l: any) => {
        lines.push({
          code: l.code,
          name: l.name,
          budget: l.amountParam,
          committed: l.amountCommitted,
          executed: l.amountExecuted,
          variance: l.amountParam - l.amountExecuted
        });
        totalBudget += l.amountParam;
        totalCommitted += l.amountCommitted;
        totalExecuted += l.amountExecuted;
      });
    });

    return {
      projectName: project.name,
      currency: project.currency,
      summary: {
        totalBudget,
        totalCommitted,
        totalExecuted,
        remainingBudget: totalBudget - totalCommitted
      },
      lines: lines.sort((a, b) => a.code.localeCompare(b.code))
    };
  }

  // Placeholder CRUD methods 
  create(createReportDto: any) { return 'This action adds a new report'; }
  findAll() { return `This action returns all reports`; }
  findOne(id: number) { return `This action returns a #${id} report`; }
  update(id: number, updateReportDto: any) { return `This action updates a #${id} report`; }
  remove(id: number) { return `This action removes a #${id} report`; }
}
