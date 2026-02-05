import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) { }

  async getDashboardStats(tenantId: string, period?: string) {
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

    // 4. Chart Data (Based on Period)
    const chartData = await this.getChartData(tenantId, prisma, period || '6m', totalBudget);

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
      },
      chartData
    };
  }

  // Helper for Chart Data
  private async getChartData(tenantId: string, prisma: any, period: string, totalBudget: number) {
    const dataPoints: { name: string; budget: number; actual: number }[] = [];

    // Determine range and labels
    if (period === '4w') {
      // Last 4 Weeks
      for (let i = 3; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - (i * 7));
        const label = `W${this.getWeekNumber(d)}`;

        dataPoints.push({ name: label, budget: Math.round(totalBudget / 52), actual: 0 });
      }
    } else if (period === 'q') {
      // Quarters (current year)
      ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
        dataPoints.push({ name: q, budget: Math.round(totalBudget / 4), actual: 0 });
      });
    } else {
      // Default: Last 6 Months
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const label = d.toLocaleString('default', { month: 'short' });
        dataPoints.push({ name: label, budget: Math.round(totalBudget / 12), actual: 0 });
      }
    }

    // Fetch Invoices to populate Actuals
    const startDate = new Date();
    if (period === '4w') startDate.setDate(startDate.getDate() - 30);
    else if (period === 'q') startDate.setMonth(0, 1); // Jan 1st
    else startDate.setMonth(startDate.getMonth() - 6);

    const invoices = await prisma.invoice.findMany({
      where: {
        project: { tenantId },
        status: { in: ['APPROVED', 'PAID'] },
        date: { gte: startDate }
      },
      select: { date: true, total: true }
    });

    // Bucketize
    invoices.forEach((inv: any) => {
      let key = '';
      const d = new Date(inv.date);

      if (period === '4w') {
        key = `W${this.getWeekNumber(d)}`;
      } else if (period === 'q') {
        const month = d.getMonth();
        if (month < 3) key = 'Q1';
        else if (month < 6) key = 'Q2';
        else if (month < 9) key = 'Q3';
        else key = 'Q4';
      } else {
        key = d.toLocaleString('default', { month: 'short' });
      }

      const point = dataPoints.find(p => p.name === key);
      if (point) {
        point.actual += inv.total;
      }
    });

    return dataPoints.map(p => ({
      name: p.name,
      Budget: p.budget,
      Actual: p.actual
    }));
  }

  private getWeekNumber(d: Date) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
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
    const lines: any[] = [];
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
  findAll() { return 'This action returns all reports'; }
  findOne(id: number) { return `This action returns a #${id} report`; }
  update(id: number, updateReportDto: any) { return `This action updates a #${id} report`; }
  remove(id: number) { return `This action removes a #${id} report`; }
}
