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
    return this.injectDefaultCostCenters({
      ...project,
      managerName: (project as any).projectManager?.name,
    });
  }

  private injectDefaultCostCenters(project: any) {
    if (!project.costCenters || (Array.isArray(project.costCenters) && project.costCenters.length === 0)) {
      project.costCenters = [
        { code: 'MAT', name: 'Materia Prima' },
        { code: 'MO', name: 'Mano de Obra' },
        { code: 'VIA', name: 'Viáticos' },
        { code: 'OG', name: 'Otros Gastos' },
        { code: 'SER', name: 'Servicios Tercerizados' },
      ];
    }
    return project;
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

    if (user.role === 'PROJECT_MANAGER') {
      const projects = await this.prisma.project.findMany({
        where: {
          tenantId,
          projectManagerId: user.userId || user.id,
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
        mainContractor: {
          select: { name: true },
        },
      },
    });
    return projects.map((p) => ({
      ...p,
      managerName: (p as any).projectManager?.name,
      constructorName: (p as any).mainContractor?.name,
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
        mainContractor: {
          select: { name: true },
        },
      },
    });

    if (!project || project.tenantId !== tenantId) {
      throw new NotFoundException('Project not found');
    }

    const result = this.injectDefaultCostCenters({
      ...project,
      managerName: (project as any).projectManager?.name,
      constructorName: (project as any).mainContractor?.name,
    });

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
    const [activities, backlogItems, budgets, pos, rawMilestones, rawMaterials] = await Promise.all([
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
      // Milestones for dashboard
      this.prisma.projectMilestone.findMany({
        where: { projectId: id },
        orderBy: { date: 'asc' },
      }),
      // Materials for actual costs
      this.prisma.projectMaterial.findMany({
        where: { projectId: id },
      }),
    ]);

    // 1. Progress (Fases Principales)
    let avgProgress = 0;
    const progressData = activities.map(act => {
      let color = '#f59e0b'; // Default Active/In Progress Orange
      if (act.percent === 100) color = '#10b981'; // Green Done
      else if (act.percent === 0) color = '#64748b'; // Gray Not started
      
      avgProgress += act.percent;
      
      return {
        name: act.name,
        percentage: act.percent,
        color
      };
    }).slice(0, 5); // Limit to top 5 phases visually
    
    if (activities.length > 0) {
      avgProgress = avgProgress / activities.length;
    }

    // 2. Sprint Data (Active Sprint for the project)
    const activeSprintData = await this.prisma.sprint.findFirst({
        where: { projectId: id, status: 'ACTIVE' },
        include: { items: { include: { backlogItem: true } } }
    });

    let activeSprint = null;
    if (activeSprintData) {
        const totalTasks = activeSprintData.items.length;
        const completedTasks = activeSprintData.items.filter(i => i.boardStatus === 'DONE').length;
        const blockedTasks = activeSprintData.items.filter(i => i.boardStatus === 'BLOCKED').length;
        
        activeSprint = {
            id: activeSprintData.id,
            name: activeSprintData.name,
            goal: activeSprintData.goal || 'No hay objetivo definido',
            startDate: new Date(activeSprintData.startDate).toISOString(),
            endDate: new Date(activeSprintData.endDate).toISOString(),
            completedTasks,
            totalTasks,
            blockedTasks
        }
    }

    // 3. Costs (Real Data from ProjectMaterials)
    let totalBudget = 0;
    let totalConsumed = 0;

    rawMaterials.forEach((mat) => {
      totalBudget += mat.plannedQty * mat.plannedPrice;
      totalConsumed += mat.stockConsumed * mat.plannedPrice;
    });

    const startDate = project.startDate ? new Date(project.startDate) : new Date();
    const endDate = project.endDate ? new Date(project.endDate) : new Date(new Date().setMonth(startDate.getMonth() + 1));
    const nowLocal = new Date();

    if (endDate.getTime() <= startDate.getTime()) {
      endDate.setMonth(startDate.getMonth() + 1);
    }
    
    // Estimate Time Elapsed
    const totalProjectMs = endDate.getTime() - startDate.getTime();
    const elapsedMs = Math.max(0, nowLocal.getTime() - startDate.getTime());
    let timeElapsedPercent = Math.round((elapsedMs / totalProjectMs) * 100);
    if (timeElapsedPercent > 100) timeElapsedPercent = 100;

    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1;
    const budgetPerMonth = totalBudget / monthsDiff;

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const costsData = [];

    let cumPlanned = 0;
    let cumActual = 0;

    for (let i = 0; i < monthsDiff; i++) {
        const currentMonth = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        const name = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

        cumPlanned += budgetPerMonth;

        let actualForMonth = 0;
        if (currentMonth.getTime() <= nowLocal.getTime() || (currentMonth.getMonth() === nowLocal.getMonth() && currentMonth.getFullYear() === nowLocal.getFullYear())) {
             const elapsedMonths = Math.max(1, (nowLocal.getFullYear() - startDate.getFullYear()) * 12 + (nowLocal.getMonth() - startDate.getMonth()) + 1);
             actualForMonth = totalConsumed / Math.max(1, elapsedMonths);
             cumActual += actualForMonth;
        }

        costsData.push({
            name,
            budget: Math.round(totalBudget),
            planned: Math.round(cumPlanned),
            actual: (currentMonth.getTime() <= nowLocal.getTime() || (currentMonth.getMonth() === nowLocal.getMonth() && currentMonth.getFullYear() === nowLocal.getFullYear())) ? Math.round(cumActual) : null,
        });
    }

    const costBudgetPercent = totalBudget > 0 ? Math.min(100, Math.round((totalConsumed / totalBudget) * 100)) : 0;

    // ---------------------------------------------------------
    // NEW METRICS (Mock Data for visual demonstration)
    // ---------------------------------------------------------

    // A. Milestones Health (Estado de Hitos Críticos)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const milestonesData = rawMilestones.map(m => {
      let status = 'ON_TRACK';
      if (m.status !== 'COMPLETED') {
        const mDate = new Date(m.date);
        mDate.setHours(0, 0, 0, 0);
        const diffTime = mDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
          status = 'DELAYED';
        } else if (diffDays <= 7) {
          status = 'AT_RISK';
        }
      }

      return {
        name: m.name,
        date: new Date(m.date).toISOString().split('T')[0],
        status,
      };
    }).slice(0, 5); // Pick top 5 earliest

    // B. Constructor Progress (Eficiencia del Contratista)
    const constructorProgressData = [
      { name: 'Contratista A (Estructura)', progress: 85, color: '#3b82f6' },
      { name: 'Contratista B (Acabados)', progress: 12, color: '#f59e0b' },
      { name: 'Contratista C (MEP)', progress: 45, color: '#10b981' },
    ];

    // C. Blockers Overview (Índice de Actividades Bloqueadas)
    const blockersData = {
      totalBlocked: 6,
      categories: [
        { reason: 'Falta de Materiales', count: 3, color: '#ef4444' },
        { reason: 'Permisos Municipales', count: 2, color: '#f97316' },
        { reason: 'Clima', count: 1, color: '#3b82f6' },
      ]
    };

    return {
      health: {
        timeElapsedPercent,
        progressPercent: Math.round(avgProgress),
        costBudgetPercent,
      },
      progress: progressData,
      activeSprint,
      costs: costsData,
      milestones: milestonesData,
      constructorProgress: constructorProgressData,
      blockers: blockersData,
    };
  }

  async getMembers(projectId: string, tenantId: string) {
    // Basic tenancy check
    await this.findOne(projectId, tenantId);

    // Fetch members with user info
    return this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    tenantId: string,
  ) {
    // Ensure ownership
    await this.findOne(id, tenantId);

    const { startDate, endDate, globalBudget, ...restData } = updateProjectDto;

    const data: any = { ...restData };
    if (startDate) data.startDate = new Date(startDate);
    if (endDate) data.endDate = new Date(endDate);
    if (globalBudget !== undefined) data.globalBudget = Number(globalBudget);

    const project = await this.prisma.project.update({
      where: { id },
      data,
      include: {
        projectManager: { select: { name: true } },
      },
    });

    return this.injectDefaultCostCenters({
      ...project,
      managerName: project.projectManager?.name,
    });
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
