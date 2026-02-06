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

  async getSCurve(projectId: string, tenantId: string) {
    const prisma = this.prisma as any;

    // 1. Fetch Project with Activities & Budget
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        activities: {
          include: { budgetLine: true, progressRecords: true }
        },
        budgets: { include: { budgetLines: true } }
      }
    });

    if (!project || project.tenantId !== tenantId) throw new NotFoundException('Project not found');

    // 2. Determine Timeline
    // Use Project Dates or Activity Dates
    let start = project.startDate ? new Date(project.startDate) : new Date();
    let end = project.endDate ? new Date(project.endDate) : new Date();

    if (!project.startDate && project.activities.length > 0) {
      // Auto-detect from activities
      const starts = project.activities.map((a: any) => new Date(a.startDate).getTime());
      start = new Date(Math.min(...starts));
      const ends = project.activities.map((a: any) => new Date(a.endDate).getTime());
      end = new Date(Math.max(...ends));
    }

    // Align to weeks
    start = this.getStartOfWeek(start);
    end.setDate(end.getDate() + 7); // Pad end

    const timeline: { date: string; pv: number; ev: number; ac: number }[] = [];
    let current = new Date(start);

    // 3. Calculate Cumulative Data Points
    let cumPV = 0;
    let cumEV = 0;

    // Optimized: Pre-calculate daily burn rates for all activities
    const activityBurns = project.activities.map((act: any) => {
      const s = new Date(act.startDate).getTime();
      const e = new Date(act.endDate).getTime();
      const duration = Math.max(1, (e - s) / (1000 * 60 * 60 * 24));
      const budget = act.budgetLine?.amountParam || (act.plannedWeight * 1000); // Fallback to weight * 1000 if no budget

      return {
        ...act,
        startMs: s,
        endMs: e,
        dailyPV: budget / duration,
        totalBudget: budget
      };
    });

    // Note: Actual Cost should effectively come from Invoices. 
    // For this MVP, we will simulate AC tracking close to EV or use InvoiceAllocations if available.
    // Let's check Invoice Allocations.
    const allocations = await prisma.invoiceAllocation.findMany({
      where: { invoice: { projectId } },
      include: { invoice: true }
    });


    while (current <= end) {
      const currentMs = current.getTime();
      const dateKey = current.toISOString().split('T')[0];

      // PV: Sum of value for all days up to 'current' logic? 
      // Simpler: Just recalculate total PV up to this date.
      // Iterate all activities, check how much overlap with [Start -> Current]

      let pv = 0;
      let ev = 0;

      activityBurns.forEach((act: any) => {
        // PV Calculation
        if (currentMs >= act.startMs) {
          if (currentMs >= act.endMs) {
            pv += act.totalBudget;
          } else {
            const daysPassed = (currentMs - act.startMs) / (1000 * 60 * 60 * 24);
            pv += daysPassed * act.dailyPV;
          }
        }

        // EV Calculation
        // Precise: Look for progress record at this week.
        // Heuristic: Use current percent if date is past today? No, that flattens history.
        // We need historical EV.
        // Find closest progress record <= current date
        const record = act.progressRecords
          .filter((r: any) => new Date(r.weekStartDate) <= current)
          .sort((a: any, b: any) => new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime())[0];

        const percent = record ? record.percent : (currentMs > new Date().getTime() ? 0 : 0);
        // Logic gap: if no record but activity started? Assume 0. 
        // Logic gap: if current > today, we shouldn't predict EV. EV stops at Today.

        if (currentMs <= new Date().getTime()) {
          ev += (percent / 100) * act.totalBudget;
        }
      });

      // AC Calculation
      // Sum allocations with invoice date <= current
      const ac = allocations
        .filter((a: any) => new Date(a.invoice.date) <= current)
        .reduce((sum: number, a: any) => sum + a.amount, 0);

      timeline.push({
        date: dateKey,
        pv,
        ev: currentMs > new Date().getTime() ? null as any : ev, // Null for future
        ac: currentMs > new Date().getTime() ? null as any : ac
      });

      current.setDate(current.getDate() + 7);
    }

    return timeline;
  }

  async getResourceHistogram(projectId: string, tenantId: string) {
    const prisma = this.prisma as any;
    // Fetch activities with contractors
    const activities = await prisma.projectActivity.findMany({
      where: { projectId, tenantId, contractorId: { not: null } },
      include: { contractor: true }
    });

    // Find range
    if (activities.length === 0) return [];
    const starts = activities.map((a: any) => new Date(a.startDate).getTime());
    const ends = activities.map((a: any) => new Date(a.endDate).getTime());
    let current = this.getStartOfWeek(new Date(Math.min(...starts)));
    const end = new Date(Math.max(...ends));
    end.setDate(end.getDate() + 7);

    const histogram: any[] = [];

    const contractors = Array.from(new Set(activities.map((a: any) => a.contractor.name)));

    while (current <= end) {
      const weekLabel = current.toISOString().split('T')[0];
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const entry: any = { date: weekLabel };

      contractors.forEach((cName: any) => {
        // Count active tasks for this contractor in this week
        // Overlap logic: Start <= WeekEnd AND End >= WeekStart
        const count = activities.filter((a: any) =>
          a.contractor.name === cName &&
          new Date(a.startDate) <= weekEnd &&
          new Date(a.endDate) >= current
        ).length;

        entry[cName as string] = count;
      });

      histogram.push(entry);
      current.setDate(current.getDate() + 7);
    }

    return histogram;
  }

  private getStartOfWeek(d: Date) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    return new Date(date.setDate(diff));
  }

  // Placeholder CRUD methods 
  create(createReportDto: any) { return 'This action adds a new report'; }
  findAll() { return 'This action returns all reports'; }
  findOne(id: number) { return `This action returns a #${id} report`; }
  update(id: number, updateReportDto: any) { return `This action updates a #${id} report`; }
  remove(id: number) { return `This action removes a #${id} report`; }
}
