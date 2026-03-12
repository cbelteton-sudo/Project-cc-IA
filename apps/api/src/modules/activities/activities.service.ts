import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateActivityDto,
  UpdateActivityDto,
  AddDependencyDto,
  CloseActivityDto,
} from './dto/create-activity.dto';
import { ReorderActivitiesDto } from './dto/reorder-activities.dto';
import { AddActivityMaterialDto } from './dto/add-activity-material.dto';
// Trigger rebuild after prisma generate

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateActivityDto) {
    try {
      // 1. Verify Project exists and dates are valid
      const project = await this.prisma.project.findFirst({
        where: { id: dto.projectId, tenantId },
      });
      if (!project)
        throw new NotFoundException(
          'Project not found (check tenant/project id)',
        );

      const start = new Date(dto.startDate);
      const end = new Date(dto.endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestException('Invalid date format');
      }

      if (start > end)
        throw new BadRequestException('Start date must be before end date');

      // Date Boundary Validation
      if (!dto.parentId && project.startDate && project.endDate) {
        // We set times to midnight for fair comparison of days
        const pStart = new Date(project.startDate);
        pStart.setHours(0, 0, 0, 0);
        const pEnd = new Date(project.endDate);
        pEnd.setHours(23, 59, 59, 999); // End of the day

        const aStart = new Date(start);
        aStart.setHours(0, 0, 0, 0);
        const aEnd = new Date(end);
        aEnd.setHours(0, 0, 0, 0);

        if (aStart < pStart || aEnd > pEnd) {
          const strStart = pStart.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
          const strEnd = pEnd.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
          throw new BadRequestException(
            `Las fechas de la actividad deben estar dentro del rango general del proyecto: ${strStart} al ${strEnd}`,
          );
        }
      }

      // Sub-Activity Date Validation (against Parent)
      if (dto.parentId) {
        const parent = await this.prisma.projectActivity.findUnique({
          where: { id: dto.parentId },
        });
        if (parent) {
          const pStart = new Date(parent.startDate);
          pStart.setHours(0, 0, 0, 0);
          const pEnd = new Date(parent.endDate);
          pEnd.setHours(23, 59, 59, 999);

          const aStart = new Date(start);
          aStart.setHours(0, 0, 0, 0);
          const aEnd = new Date(end);
          aEnd.setHours(0, 0, 0, 0);

          if (aStart < pStart || aEnd > pEnd) {
            const strStart = pStart.toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });
            const strEnd = pEnd.toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });
            throw new BadRequestException(
              `Las fechas de la sub-actividad deben estar dentro del rango de su actividad principal: ${strStart} al ${strEnd}`,
            );
          }
        }
      }

      // 2. Auto-generate code if missing (Simple Random for MVP)
      let code = dto.code;
      if (!code) {
        const prefix = project.name.substring(0, 3).toUpperCase();
        const random = Math.random().toString(36).substring(2, 7).toUpperCase();
        code = `${prefix}-${random}`;
      }

      // Safe parse weight
      const weight = Number(dto.plannedWeight);
      const safeWeight = isNaN(weight) ? 0 : weight;

      // Sanitize inputs (Frontend might send "" for optional fields)
      const safeContractorId = dto.contractorId ? dto.contractorId : undefined;
      const safeParentId = dto.parentId ? dto.parentId : undefined;

      // 3. Calc orderIndex (append to end)
      // Ideally should check parent's existing children count or max orderIndex
      const aggregations = await this.prisma.projectActivity.aggregate({
        where: {
          projectId: dto.projectId,
          parentId: safeParentId, // Match siblings
        },
        _max: { orderIndex: true } as any,
      });
      const nextIndex = ((aggregations._max as any).orderIndex ?? -1) + 1;

      const result = await this.prisma.projectActivity.create({
        data: {
          tenantId,
          projectId: dto.projectId,
          parentId: safeParentId,
          name: dto.name,
          code,
          startDate: start,
          endDate: end,
          contractorId: safeContractorId,
          status: 'NOT_STARTED',
          plannedWeight: safeWeight,
          orderIndex: nextIndex,
        } as any,
      });

      // 4. Auto-create corresponding BacklogItem for integration
      try {
        let parentBacklogItemId: string | null = null;
        if (safeParentId) {
          const parentItem = await this.prisma.backlogItem.findFirst({
            where: { linkedWbsActivityId: safeParentId },
          });
          if (parentItem) {
            parentBacklogItemId = parentItem.id;
          }
        }

        await this.prisma.backlogItem.create({
          data: {
            projectId: dto.projectId,
            title: dto.name,
            description: `Actividad creada desde el cronograma. Fecha: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
            type: safeParentId ? 'TASK' : 'EPIC', // Root items are Epics, sub-items are Tasks
            priority: 3,
            status: 'PENDING',
            dueDate: end,
            linkedWbsActivityId: result.id,
            parentId: parentBacklogItemId,
            contractorId: safeContractorId,
          },
        });
      } catch (e) {
        console.error('Failed to auto-create backlog item for activity:', e);
      }

      // 4. Trigger Rollup if this activity has a parent
      if (result.parentId) {
        await this.updateParentChain(tenantId, result.parentId);
      }

      return result;
    } catch (error) {
      console.error('CREATE ERROR FULL DETAIL:', error);
      throw error;
    }
  }

  async findAllByProject(tenantId: string, projectId: string) {
    // Debug: Remove tenantId filter to see if we find ANYTHING for this project
    // return this.prisma.projectActivity.findMany({
    //    where: { tenantId, projectId },
    // ...

    // Debug query
    const count = await this.prisma.projectActivity.count({
      where: { projectId },
    });

    // Fetch flat list, UI builds the tree
    const results = await this.prisma.projectActivity.findMany({
      where: { projectId }, // <--- REMOVED tenantId
      include: {
        contractor: true,
        dependencies: { include: { dependsOn: true } },
        progressRecords: { orderBy: { weekStartDate: 'desc' }, take: 1 },
        milestones: true, // Include milestones for tree visualization
      },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate CPM
    return this.calculateCPM(results);
  }

  private calculateCPM(activities: any[]) {
    if (activities.length === 0) return [];

    // 1. Map to easier structure
    const nodes = new Map<
      string,
      {
        id: string;
        duration: number;
        es: number;
        ef: number;
        ls: number;
        lf: number;
        predecessors: string[];
        successors: string[];
        original: any;
      }
    >();

    activities.forEach((a) => {
      const start = new Date(a.startDate).getTime();
      const end = new Date(a.endDate).getTime();
      const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)); // Days

      nodes.set(a.id, {
        id: a.id,
        duration: Math.max(1, duration), // Min 1 day
        es: 0,
        ef: 0,
        ls: Infinity,
        lf: Infinity,
        predecessors: a.dependencies.map((d: any) => d.dependsOnId),
        successors: [], // Will fill
        original: a,
      });
    });

    // Fill successors
    nodes.forEach((node) => {
      node.predecessors.forEach((predId) => {
        const pred = nodes.get(predId);
        if (pred) pred.successors.push(node.id);
      });
    });

    // 2. Forward Pass (ES, EF)
    // Topological sort not strictly needed if we iterate until stable, but standard approach:
    // Or simpler: iterative updates. Since dag depth is finite.

    const sortedIds = this.topologicalSort(nodes);

    sortedIds.forEach((id) => {
      const node = nodes.get(id)!;
      // ES = max(EF of predecessors)
      let maxPredEF = 0;
      node.predecessors.forEach((pId) => {
        const p = nodes.get(pId);
        if (p && p.ef > maxPredEF) maxPredEF = p.ef;
      });
      node.es = maxPredEF;
      node.ef = node.es + node.duration;
    });

    const projectDuration = Math.max(
      ...Array.from(nodes.values()).map((n) => n.ef),
    );

    // 3. Backward Pass (LF, LS)
    // Iterate reverse topological
    [...sortedIds].reverse().forEach((id) => {
      const node = nodes.get(id)!;
      // LF = min(LS of successors)
      if (node.successors.length === 0) {
        node.lf = projectDuration;
      } else {
        let minSuccLS = Infinity;
        node.successors.forEach((sId) => {
          const s = nodes.get(sId);
          if (s && s.ls < minSuccLS) minSuccLS = s.ls;
        });
        node.lf = minSuccLS;
      }
      node.ls = node.lf - node.duration;
    });

    // 4. Mark Critical (Float == 0)
    return Array.from(nodes.values()).map((n) => {
      const float = n.ls - n.es;
      // Slack tolerance (e.g. < 0.1) due to float/math
      const isCritical = float < 0.5;
      return {
        ...n.original,
        cpm: {
          es: n.es,
          ef: n.ef,
          ls: n.ls,
          lf: n.lf,
          float,
          isCritical,
        },
        isCritical, // Top level convenience
      };
    });
  }

  private topologicalSort(nodes: Map<string, any>) {
    const visited = new Set<string>();
    const stack: string[] = [];

    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      const node = nodes.get(id);
      if (node) {
        node.successors.forEach((sId: string) => visit(sId));
      }
      stack.push(id);
    };

    nodes.forEach((_, id) => {
      if (!visited.has(id)) {
        // But wait, standard dfs topo sort is for processing dependencies first.
        // My graph: predecessors -> successors.
        // So if I visit successors recursively, I push node AFTER successors.
        // That gives reverse topological order.
        // So I need to reverse stack to get topological.
        visit(id);
      }
    });

    return stack.reverse();
  }

  async findOne(tenantId: string, id: string) {
    const activity = await this.prisma.projectActivity.findFirst({
      where: { id, tenantId },
      include: {
        dependencies: { include: { dependsOn: true } },
        progressRecords: { orderBy: { weekStartDate: 'desc' } },
        closureRecord: true,
        milestones: true, // Include linked milestones
        contractor: true,
        parent: { include: { contractor: true } },
        dailyUpdates: {
          orderBy: { createdAt: 'desc' },
          include: { user: true, photos: true },
        },
        fieldUpdates: {
          include: { fieldUpdate: true },
          orderBy: { fieldUpdate: { date: 'desc' } },
        },
        fieldDailyEntries: {
          include: { dailyReport: true, photos: true },
          orderBy: { dailyReport: { date: 'desc' } },
        },
        children: true, // Include sub-activities
        backlogItems: {
          include: { assigneeUser: true },
        },
        crewLeader: true,
      },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    return activity;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateActivityDto,
    userId: string,
  ) {
    const activity = await this.findOne(tenantId, id);

    // Date Boundary Validation on Update
    if (dto.startDate || dto.endDate) {
      const project = await this.prisma.project.findUnique({
        where: { id: activity.projectId },
      });

      if (!activity.parentId && project?.startDate && project?.endDate) {
        const pStart = new Date(project.startDate);
        pStart.setHours(0, 0, 0, 0);
        const pEnd = new Date(project.endDate);
        pEnd.setHours(23, 59, 59, 999);

        const aStart = dto.startDate
          ? new Date(dto.startDate)
          : new Date(activity.startDate);
        aStart.setHours(0, 0, 0, 0);

        const aEnd = dto.endDate
          ? new Date(dto.endDate)
          : new Date(activity.endDate);
        aEnd.setHours(0, 0, 0, 0);

        if (aStart < pStart || aEnd > pEnd) {
          const strStart = pStart.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
          const strEnd = pEnd.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
          throw new BadRequestException(
            `Las fechas de la actividad deben estar dentro del rango general del proyecto: ${strStart} al ${strEnd}`,
          );
        }
      }

      // Sub-Activity Date Validation (against Parent) if updating dates
      if (activity.parentId) {
        const parent = await this.prisma.projectActivity.findUnique({
          where: { id: activity.parentId },
        });

        if (parent) {
          const pStart = new Date(parent.startDate);
          pStart.setHours(0, 0, 0, 0);
          const pEnd = new Date(parent.endDate);
          pEnd.setHours(23, 59, 59, 999);

          const aStart = dto.startDate
            ? new Date(dto.startDate)
            : new Date(activity.startDate);
          aStart.setHours(0, 0, 0, 0);

          const aEnd = dto.endDate
            ? new Date(dto.endDate)
            : new Date(activity.endDate);
          aEnd.setHours(0, 0, 0, 0);

          if (aStart < pStart || aEnd > pEnd) {
            const strStart = pStart.toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });
            const strEnd = pEnd.toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });
            throw new BadRequestException(
              `Las fechas de la sub-actividad deben estar dentro del rango de su actividad principal: ${strStart} al ${strEnd}`,
            );
          }
        }
      }
    }

    // Validation: Dependency Rule (Must be > 85% to start)
    // Check if we are starting the activity (either by setting status or adding progress)
    const isStarting =
      (dto.percent !== undefined &&
        Number(dto.percent) > 0 &&
        activity.percent === 0) ||
      (dto.status === 'IN_PROGRESS' && activity.status !== 'IN_PROGRESS');

    if (isStarting) {
      const blockingDeps = activity.dependencies.filter(
        (d) => d.dependsOn.percent < 85,
      );
      if (blockingDeps.length > 0) {
        const names = blockingDeps.map((d) => d.dependsOn.name).join(', ');
        throw new BadRequestException(
          `No se puede iniciar: Dependencias incompletas (${names} < 85%)`,
        );
      }
    }

    // If progress update requested
    if (dto.percent !== undefined) {
      const inputPercent = Number(dto.percent);

      const today = new Date();
      // Create Midnight Date for "Start of Week" (Monday) to avoid time-based duplicates
      const day = today.getDay() || 7; // Get current day number, converting Sun (0) to 7
      if (day !== 1) today.setHours(-24 * (day - 1));
      else today.setHours(0, 0, 0, 0); // If today is Monday, just reset time

      // Actually, safer logic:
      const d = new Date();
      const dayOfWeek = d.getDay();
      const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust when day is sunday
      const weekStart = new Date(d.setDate(diff));
      weekStart.setHours(0, 0, 0, 0);

      // 1. Create a NEW Progress Record (History Log)
      // We use specific timestamp to avoid overwriting previous updates in the same week
      await this.prisma.activityWeeklyProgress.create({
        data: {
          tenantId,
          projectId: activity.projectId,
          activityId: id,
          weekStartDate: new Date(), // Use exact timestamp to act as a log
          percent: inputPercent,
          notes: dto.notes,
        },
      });

      // 2. Update Main Activity Status & Percent directly (User Input is Source of Truth)
      const finalPercent = Math.min(100, Math.max(0, inputPercent)); // Clamp 0-100

      // Auto-update Status logic only if not manually setting status
      let newStatus = activity.status;
      if (dto.status) {
        newStatus = dto.status;
      } else if (
        finalPercent > 0 &&
        finalPercent < 100 &&
        activity.status === 'NOT_STARTED'
      ) {
        newStatus = 'IN_PROGRESS';
      } else if (finalPercent >= 100) {
        newStatus = 'DONE';
      }

      // 3. Update Main Activity
      await this.prisma.projectActivity.update({
        where: { id },
        data: {
          status: newStatus,
          percent: finalPercent,
          assignedUserId: dto.assignedUserId, // Allow updating supervisor
        },
      });

      // 4. Trigger Rollup if this activity has a parent
      if (activity.parentId) {
        await this.updateParentChain(tenantId, activity.parentId);
      }

      // 5. AUTOMATION: If progress > 0 and Project is not started, start it
      if (finalPercent > 0) {
        const project = await this.prisma.project.findUnique({
          where: { id: activity.projectId },
        });

        if (project && !project.startDate) {
          console.log(
            `[AUTOMATION] Starting Project ${project.id} due to Activity ${activity.id} progress`,
          );
          await this.prisma.project.update({
            where: { id: project.id },
            data: {
              startDate: new Date(),
              status: 'IN_PROGRESS',
            },
          });
        }
      }

      // 6. CREATE HISTORY LOG (DailyUpdate)
      // This ensures every report is saved as a discrete history item, not just updating the weekly snapshot.
      if (dto.notes) {
        await this.prisma.dailyUpdate
          .create({
            data: {
              projectId: activity.projectId,
              wbsActivityId: id,
              text: dto.notes,
              userId: (dto as any).userId || 'UNKNOWN', // Fallback if missing
            },
          })
          .catch((e) => console.error('Failed to create DailyUpdate log', e));
      }
    }

    return this.prisma.projectActivity.update({
      where: { id },
      data: {
        name: dto.name,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        status: dto.status,
        contractorId: dto.contractorId,
        budgetLineId: (dto as any).budgetLineId,
        crewLeaderId: (dto as any).crewLeaderId,
      },
    });
  }

  async addDependency(
    tenantId: string,
    activityId: string,
    dto: AddDependencyDto,
  ) {
    const activity = await this.findOne(tenantId, activityId);

    // Prevent self-dependency
    if (activityId === dto.dependsOnActivityId)
      throw new BadRequestException('Cannot depend on self');

    // Prevent duplicates
    const exists = await this.prisma.activityDependency.findFirst({
      where: { activityId, dependsOnId: dto.dependsOnActivityId },
    });
    if (exists) throw new ConflictException('Dependency already exists');

    return this.prisma.activityDependency.create({
      data: {
        tenantId,
        projectId: activity.projectId,
        activityId,
        dependsOnId: dto.dependsOnActivityId,
      },
    });
  }

  async removeDependency(
    tenantId: string,
    activityId: string,
    dependencyId: string,
  ) {
    // Verify ownership/existence via deleteMany or findFirst
    // Safer to find first
    const dep = await this.prisma.activityDependency.findFirst({
      where: { id: dependencyId, activityId, tenantId },
    });

    if (!dep) throw new NotFoundException('Dependency not found');

    return this.prisma.activityDependency.delete({
      where: { id: dependencyId },
    });
  }

  async closeActivity(
    tenantId: string,
    activityId: string,
    dto: CloseActivityDto,
  ) {
    const activity = await this.prisma.projectActivity.findFirst({
      where: { id: activityId, tenantId },
      include: {
        dependencies: { include: { dependsOn: true } },
        children: true,
      },
    });

    if (!activity) throw new NotFoundException('Activity not found');

    // 1. Validation: Progress must be 100%
    if (activity.percent < 100) {
      throw new BadRequestException(
        'Activity must be 100% completed before closing.',
      );
    }

    // 2. Validation: All dependencies must be DONE or CLOSED
    const pendingDeps = activity.dependencies.filter(
      (d) => d.dependsOn.status !== 'DONE' && d.dependsOn.status !== 'CLOSED',
    );

    if (pendingDeps.length > 0) {
      const names = pendingDeps.map((d) => d.dependsOn.name).join(', ');
      throw new BadRequestException(
        `Cannot close: Pending dependencies (${names})`,
      );
    }

    // 3. Validation: If it has children, all must be DONE or CLOSED
    // (Optional strictness, but good for data integrity)
    const pendingChildren = activity.children.filter(
      (c) => c.status !== 'DONE' && c.status !== 'CLOSED',
    );
    if (pendingChildren.length > 0) {
      throw new BadRequestException(
        'Cannot close: All sub-activities must be completed first.',
      );
    }

    // 4. Create Closure Record & Update Status
    return this.prisma.$transaction(async (tx) => {
      // Delete existing closure record if any (re-closing)
      await tx.activityClosureRecord.deleteMany({ where: { activityId } });

      const record = await tx.activityClosureRecord.create({
        data: {
          tenantId,
          projectId: activity.projectId,
          activityId,
          closureCode: `CL-${new Date().getTime()}`, // Simple unique code
          closedAt: new Date(),
          pmName: dto.pmName,
          directorName: dto.directorName,
          contractorName: dto.contractorName,
        },
      });

      await tx.projectActivity.update({
        where: { id: activityId },
        data: { status: 'CLOSED' },
      });

      return record;
    });
  }
  private async updateParentChain(tenantId: string, parentId: string) {
    // 1. Get all siblings (children of this parent)
    const children = await this.prisma.projectActivity.findMany({
      where: { parentId, tenantId },
      select: {
        startDate: true,
        endDate: true,
        percent: true,
        plannedWeight: true,
      },
    });

    if (children.length === 0) return;

    // 2. Calculate aggregates
    let minStart = children[0].startDate;
    let maxEnd = children[0].endDate;
    let totalWeight = 0;
    let weightedProgress = 0;

    children.forEach((child) => {
      if (child.startDate < minStart) minStart = child.startDate;
      if (child.endDate > maxEnd) maxEnd = child.endDate;

      const w = child.plannedWeight || 1;
      totalWeight += w;
      weightedProgress += child.percent * w;
    });

    const newPercent =
      totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;

    // 3. Update Parent
    let newStatus = 'NOT_STARTED';
    if (newPercent > 0 && newPercent < 100) newStatus = 'IN_PROGRESS';
    else if (newPercent >= 100) newStatus = 'DONE';

    // Preserve BLOCKED if it was blocked?
    // For now, simplicity: Progress dictates status for parent containers.
    // But if we want to respect manual status, we should check current parent status.
    // User request: "Same logic". If activity starts -> Parent starts.

    const currentParent = await this.prisma.projectActivity.findUnique({
      where: { id: parentId },
      select: { status: true },
    });

    if (
      currentParent &&
      currentParent.status !== 'BLOCKED' &&
      currentParent.status !== 'CLOSED'
    ) {
      // Only update if not blocked/closed
      if (newPercent > 0 && currentParent.status === 'NOT_STARTED') {
        newStatus = 'IN_PROGRESS';
      } else if (newPercent >= 100 && currentParent.status === 'IN_PROGRESS') {
        newStatus = 'DONE';
      } else {
        newStatus = currentParent.status; // Keep existing if no transition needed
      }
    } else if (currentParent) {
      newStatus = currentParent.status;
    }

    const parent = await this.prisma.projectActivity.update({
      where: { id: parentId },
      data: {
        startDate: minStart,
        endDate: maxEnd,
        percent: newPercent,
        status: newStatus,
      },
    });

    // 4. Recurse if parent has a parent
    if (parent.parentId) {
      await this.updateParentChain(tenantId, parent.parentId);
    }
  }
  async reorder(tenantId: string, dto: ReorderActivitiesDto) {
    // Bulk update using transaction
    // Since we receive a flat list ordered by user, we just update orderIndex based on array position
    return this.prisma.$transaction(
      dto.orderedIds.map((id, index) =>
        this.prisma.projectActivity.updateMany({
          where: { id, tenantId }, // Ensure tenant safety
          data: { orderIndex: index } as any,
        }),
      ),
    );
  }
  async remove(tenantId: string, id: string) {
    const activity = await this.prisma.projectActivity.findFirst({
      where: { id, tenantId },
    });

    if (!activity) {
      throw new NotFoundException('Actividad no encontrada');
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        // Delete any dependency links where this activity is the predecessor or the successor
        await tx.activityDependency.deleteMany({
          where: {
            tenantId,
            OR: [{ activityId: id }, { dependsOnId: id }],
          },
        });

        // Finally delete the activity
        await tx.projectActivity.delete({
          where: { id },
        });
      });

      return { success: true, message: 'Actividad eliminada correctamente' };
    } catch (error) {
      // If it fails (e.g. Foreign Key constraint because of progress reports)
      throw new BadRequestException(
        'No se puede eliminar la actividad porque ya tiene registros o historial asociado.',
      );
    }
  }

  async addMaterialConsumption(
    tenantId: string,
    activityId: string,
    userId: string,
    dto: AddActivityMaterialDto,
  ) {
    const activity = await this.prisma.projectActivity.findFirst({
      where: { id: activityId, tenantId },
    });
    if (!activity) throw new NotFoundException('Activity not found');

    const projectMaterial = await this.prisma.projectMaterial.findFirst({
      where: { id: dto.projectMaterialId, projectId: activity.projectId },
    });
    if (!projectMaterial)
      throw new NotFoundException('Project Material not found');

    return this.prisma.$transaction(async (tx) => {
      const consumption = await tx.activityMaterial.create({
        data: {
          activityId,
          projectMaterialId: dto.projectMaterialId,
          quantityConsumed: dto.quantityConsumed,
          dateConsumed: dto.dateConsumed
            ? new Date(dto.dateConsumed)
            : new Date(),
          notes: dto.notes,
          reportedBy: userId,
        },
        include: {
          projectMaterial: {
            include: { material: true },
          },
        },
      });

      await tx.projectMaterial.update({
        where: { id: dto.projectMaterialId },
        data: {
          stockConsumed: { increment: dto.quantityConsumed },
          stockAvailable: { decrement: dto.quantityConsumed },
        },
      });

      // ADD TO COST LEDGER
      const consumedPrice = projectMaterial.plannedPrice || 0;
      await tx.costLedger.create({
        data: {
          projectId: activity.projectId,
          date: dto.dateConsumed ? new Date(dto.dateConsumed) : new Date(),
          wbsActivityId: activity.id,
          costType: 'MATERIAL',
          entryType: 'INVENTORY_CONSUMPTION',
          amount: dto.quantityConsumed * consumedPrice,
          referenceId: consumption.id, // reference to the ActivityMaterial record
          userId: userId,
          description:
            dto.notes || `Consumo de material en actividad: ${activity.name}`,
        },
      });

      return consumption;
    });
  }

  async removeMaterialConsumption(
    tenantId: string,
    activityId: string,
    consumptionId: string,
  ) {
    const activity = await this.prisma.projectActivity.findFirst({
      where: { id: activityId, tenantId },
    });
    if (!activity) throw new NotFoundException('Activity not found');

    const consumption = await this.prisma.activityMaterial.findFirst({
      where: { id: consumptionId, activityId },
    });
    if (!consumption)
      throw new NotFoundException('Consumption record not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.projectMaterial.update({
        where: { id: consumption.projectMaterialId },
        data: {
          stockConsumed: { decrement: consumption.quantityConsumed },
          stockAvailable: { increment: consumption.quantityConsumed },
        },
      });

      await tx.activityMaterial.delete({
        where: { id: consumptionId },
      });

      return { success: true };
    });
  }
}
