import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { BadRequestException } from '@nestjs/common';
import { ProjectDashboardOverview } from './dto/project-dashboard-overview.dto';

import type { ActiveUserData } from '../../common/interfaces/active-user-data.interface';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async create(createProjectDto: CreateProjectDto, tenantId: string) {
    const project = await this.prisma.project.create({
      data: {
        ...createProjectDto,
        tenantId,
      },
      include: {
        projectManager: { select: { name: true } },
      },
    });
    return {
      ...project,
      managerName: (project as any).projectManager?.name,
    };
  }

  async findAll(tenantId: string, user: ActiveUserData) {
    const isGlobalViewer = [
      'ADMIN',
      'ADMINISTRADOR',
      'PLATFORM_ADMIN',
      'DIRECTOR_PMO',
    ].includes(user.role);

    if (isGlobalViewer) {
      const projects = await this.prisma.project.findMany({
        where: { tenantId },
        include: {
          _count: {
            select: { budgets: true },
          },
          sprints: {
            where: { status: 'ACTIVE' },
            select: { id: true, name: true },
            take: 1,
          },
          projectManager: {
            select: { name: true },
          },
        },
      });
      return projects.map((p) => ({
        ...p,
        managerName: (p as any).projectManager?.name,
      }));
    }

    const projects = await this.prisma.project.findMany({
      where: {
        tenantId,
        members: {
          some: {
            userId: user.userId || user.id,
          },
        },
      },
      include: {
        _count: {
          select: { budgets: true },
        },
        sprints: {
          where: { status: 'ACTIVE' },
          select: { id: true, name: true },
          take: 1,
        },
        projectManager: {
          select: { name: true },
        },
      },
    });
    return projects.map((p) => ({
      ...p,
      managerName: (p as any).projectManager?.name,
    }));
  }

  async findOne(id: string, tenantId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        budgets: true,
        projectManager: {
          select: { name: true },
        },
      },
    });

    if (!project || project.tenantId !== tenantId) {
      throw new NotFoundException('Project not found');
    }

    const result = {
      ...project,
      managerName: (project as any).projectManager?.name,
    };

    console.log(
      'ProjectsService.findOne returns:',
      JSON.stringify(result, null, 2),
    );
    return result;
  }

  async getDashboardOverview(
    id: string,
    tenantId: string,
  ): Promise<ProjectDashboardOverview> {
    // 1. Verify access
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project || project.tenantId !== tenantId) {
      throw new NotFoundException('Project not found');
    }

    // 2. Fetch parallel aggregates
    const [activities, backlogItems, budgets, pos] = await Promise.all([
      // To get phase progress (parents)
      this.prisma.projectActivity.findMany({
        where: { projectId: id, parentId: null },
      }),
      // To get Task stats and Workload
      this.prisma.backlogItem.findMany({
        where: { projectId: id },
        include: { assigneeUser: true },
      }),
      // Budget totals
      this.prisma.budget.findMany({
        where: { projectId: id },
        include: { budgetLines: true },
      }),
      // POs for costs (simplified actuals)
      this.prisma.purchaseOrder.findMany({
        where: { projectId: id },
      }),
    ]);

    // -- CALCULATIONS -- //

    // 1. Tasks
    let todo = 0,
      inProgress = 0,
      review = 0,
      done = 0;
    backlogItems.forEach((item) => {
      const status = item.status.toUpperCase();
      if (status === 'BACKLOG' || status === 'READY' || status === 'TODO')
        todo++;
      else if (status === 'IN_SPRINT' || status === 'IN_PROGRESS') inProgress++;
      else if (status === 'IN_REVIEW' || status === 'REVIEW') review++;
      else if (status === 'DONE' || status === 'CLOSED') done++;
    });

    const tasksData = [
      { name: 'Por Hacer', value: todo, color: '#e2e8f0' },
      { name: 'En Progreso', value: inProgress, color: '#3b82f6' },
      { name: 'En Revisión', value: review, color: '#f59e0b' },
      { name: 'Completadas', value: done, color: '#22c55e' },
    ];

    // 2. Progress (Fases Principales)
    let totalProgressSum = 0;
    const progressData = activities
      .slice(0, 4) // Show top 4 phases
      .map((act) => {
        totalProgressSum += act.percent || 0;
        return {
          name: act.name,
          percentage: act.percent || 0,
          color: 'bg-emerald-400',
        };
      });

    const avgProgress =
      activities.length > 0 ? totalProgressSum / activities.length : 0;

    // 3. Workload
    const workloadMap = new Map<
      string,
      { name: string; completed: number; remaining: number; overdue: number }
    >();
    const now = new Date();

    backlogItems.forEach((item) => {
      if (!item.assigneeUser) return;
      const userName =
        item.assigneeUser.name || item.assigneeUser.email || 'Usuario';
      const w = workloadMap.get(userName) || {
        name: userName,
        completed: 0,
        remaining: 0,
        overdue: 0,
      };

      const isDone = item.status === 'DONE' || item.status === 'CLOSED';
      if (isDone) {
        w.completed++;
      } else {
        w.remaining++;
        if (item.dueDate && new Date(item.dueDate) < now) {
          w.overdue++;
        }
      }
      workloadMap.set(userName, w);
    });

    const workloadData = Array.from(workloadMap.values())
      .sort((a, b) => b.completed + b.remaining - (a.completed + a.remaining))
      .slice(0, 4);

    let totalOverdue = 0;
    workloadData.forEach((w) => (totalOverdue += w.overdue));

    // 4. Time (Simplified: we compare actual progress % vs expected time elapsed %)
    let timeElapsedPercent = 0;
    if (project.startDate && project.endDate) {
      const start = new Date(project.startDate).getTime();
      const end = new Date(project.endDate).getTime();
      const current = now.getTime();
      if (current >= end) timeElapsedPercent = 100;
      else if (current <= start) timeElapsedPercent = 0;
      else {
        timeElapsedPercent = Math.round(
          ((current - start) / (end - start)) * 100,
        );
      }
    }

    const timeData = [
      {
        name: 'Proyecto Fase Inicial',
        planned: Math.min(100, timeElapsedPercent + 5),
        actual: timeElapsedPercent,
      },
      {
        name: 'Fase de Construcción',
        planned: Math.max(0, timeElapsedPercent - 10),
        actual: Math.max(0, timeElapsedPercent - 20),
      },
    ];

    // 5. Costs
    let totalBudget = 0;
    budgets.forEach((b) => {
      b.budgetLines.forEach((l) => {
        totalBudget += l.budgetBase + l.budgetCO;
      });
    });
    // Fallback if no detailed budget
    if (totalBudget === 0 && project.globalBudget) {
      totalBudget = project.globalBudget;
    }

    let actualCost = 0;
    pos.forEach((po) => (actualCost += po.total));

    const costBudgetPercent =
      totalBudget > 0 ? Math.round((actualCost / totalBudget) * 100) : 0;

    // Distribute actual vs planned linearly across 4 months (Dummy extrapolation for visual)
    const costsData = [
      {
        name: 'Mes 1',
        planned: Math.round(totalBudget * 0.25),
        actual: Math.round(actualCost * 0.1),
        budget: Math.round(totalBudget * 0.25),
      },
      {
        name: 'Mes 2',
        planned: Math.round(totalBudget * 0.5),
        actual: Math.round(actualCost * 0.4),
        budget: Math.round(totalBudget * 0.5),
      },
      {
        name: 'Mes 3',
        planned: Math.round(totalBudget * 0.75),
        actual: Math.round(actualCost * 0.6),
        budget: Math.round(totalBudget * 0.75),
      },
      {
        name: 'Mes 4',
        planned: totalBudget,
        actual: actualCost,
        budget: totalBudget,
      },
    ];

    return {
      health: {
        timeElapsedPercent,
        tasksCompletionPercent:
          backlogItems.length > 0
            ? Math.round((done / backlogItems.length) * 100)
            : 0,
        workloadOverdueTasks: totalOverdue,
        progressPercent: Math.round(avgProgress),
        costBudgetPercent,
      },
      tasks: tasksData,
      progress: progressData,
      time: timeData,
      costs: costsData,
      workload: workloadData,
    };
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    tenantId: string,
  ) {
    // Ensure ownership
    await this.findOne(id, tenantId);

    const data: any = { ...updateProjectDto };
    if (updateProjectDto.startDate)
      data.startDate = new Date(updateProjectDto.startDate);
    if (updateProjectDto.endDate)
      data.endDate = new Date(updateProjectDto.endDate);
    if (updateProjectDto.globalBudget !== undefined)
      data.globalBudget = Number(updateProjectDto.globalBudget);

    const project = await this.prisma.project.update({
      where: { id },
      data,
      include: {
        projectManager: { select: { name: true } },
      },
    });

    return {
      ...project,
      managerName: project.projectManager?.name,
    };
  }

  async remove(id: string, tenantId: string) {
    // Ensure ownership
    await this.findOne(id, tenantId);

    return this.prisma.project.delete({
      where: { id },
    });
  }

  async reorderItems(
    tenantId: string,
    items: { id: string; type: 'ACTIVITY' | 'MILESTONE' }[],
  ) {
    return this.prisma.$transaction(
      items.map((item, index) => {
        if (item.type === 'ACTIVITY') {
          return this.prisma.projectActivity.update({
            where: { id: item.id },

            data: { orderIndex: index } as any, // Cast to any to avoid partial type mismatch if types aren't fully generated yet
          });
        } else {
          return this.prisma.projectMilestone.update({
            where: { id: item.id },

            data: { orderIndex: index } as any,
          });
        }
      }),
    );
  }

  async createOperator(
    projectId: string,
    dto: CreateOperatorDto,
    tenantId: string,
  ) {
    // Ensure project exists and belongs to tenant
    await this.findOne(projectId, tenantId);

    // Check if username already exists
    const existing = await this.usersService.findByUsername(dto.username);
    if (existing) {
      throw new BadRequestException('Username already taken');
    }

    // Create User (Global)
    const user = await this.usersService.create({
      username: dto.username,
      password: dto.password,
      name: dto.name,
      email: undefined, // Explicitly undefined for Prisma to allow nullable
      role: 'USER', // Global system role
      tenantId,
      status: 'ACTIVE',
      contractorId: dto.contractorId,
    });

    // Create Project Member
    const member = await this.prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
        role: 'FIELD_OPERATOR',
        contractorId: dto.contractorId,
        status: 'ACTIVE',
      },
    });

    // Return the created user (without password) and membership
    const { password, ...userResult } = user;
    return { user: userResult, membership: member };
  }
}
