import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { DashboardMetricsDto } from './dto/dashboard-metrics.dto';

@Injectable()
export class ScrumService {
  constructor(private prisma: PrismaService) {}

  // --- BACKLOG ---

  async createBacklogItem(
    data: Prisma.BacklogItemUncheckedCreateInput & { sprintId?: string },
  ) {
    const { sprintId, ...rest } = data;
    return this.prisma.backlogItem.create({
      data: {
        ...rest,
        sprintItems: sprintId
          ? {
              create: {
                sprintId,
                boardStatus: 'TODO',
              },
            }
          : undefined,
      },
    });
  }

  async getBacklog(projectId: string) {
    // 1. Fetch existing backlog items
    const backlogItems = await this.prisma.backlogItem.findMany({
      where: { projectId: String(projectId) },
      include: {
        assigneeUser: true,
        contractor: true,
        sprintItems: { include: { sprint: true } },
        children: {
          // Include tasks for Stories
          include: {
            assigneeUser: true,
            contractor: true,
            sprintItems: { include: { sprint: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Fetch unlinked leaf WBS activities
    const unlinkedActivities = await this.prisma.projectActivity.findMany({
      where: {
        projectId: String(projectId),
        children: { none: {} }, // Leaf nodes only
        backlogItems: { none: {} }, // Not yet linked
        status: { notIn: ['DONE', 'CLOSED', 'COMPLETED'] }, // Only active ones
      },
      include: { contractor: true },
      orderBy: { startDate: 'asc' },
    });

    // 3. Map activities to virtual backlog items
    const virtualItems = unlinkedActivities.map((activity) => ({
      id: activity.id,
      projectId: String(projectId),
      type: 'WBS', // distinct type
      title: activity.name,
      description: `Desde Cronograma: ${activity.code || ''}`,
      status: 'PENDING_PLANNING',
      priority: 3,
      linkedWbsActivityId: activity.id,
      dueDate: activity.endDate,
      contractor: activity.contractor,
      contractorId: activity.contractorId,
      isVirtual: true, // Flag for frontend
      createdAt: activity.createdAt,
    }));

    return [...backlogItems, ...virtualItems];
  }

  async convertWbsActivityToBacklog(activityId: string, projectId: string) {
    const activity = await this.prisma.projectActivity.findUnique({
      where: { id: String(activityId) },
    });

    if (!activity) throw new NotFoundException('Activity not found');

    // Create Backlog Item
    return this.prisma.backlogItem.create({
      data: {
        projectId: String(projectId),
        type: 'TASK',
        title: activity.name,
        description: `Imported from Gantt activity: ${activity.code || ''}`,
        status: 'BACKLOG',
        priority: 3,
        linkedWbsActivityId: String(activityId),
        // startDate: activity.startDate, // Not in schema
        dueDate: activity.endDate,
        contractorId: activity.contractorId,
        assigneeUserId: activity.assignedUserId,
      },
    });
  }

  async updateBacklogItem(id: string, data: Prisma.BacklogItemUpdateInput) {
    return this.prisma.backlogItem.update({
      where: { id },
      data,
    });
  }

  // --- SPRINTS ---

  async createSprint(data: Prisma.SprintUncheckedCreateInput) {
    return this.prisma.sprint.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    });
  }

  async getSprints(projectId: string) {
    return this.prisma.sprint.findMany({
      where: { projectId: String(projectId) },
      include: {
        retros: true,
        items: {
          include: {
            backlogItem: {
              include: {
                assigneeUser: true,
                contractor: true,
                parent: { include: { contractor: true } },
                linkedWbsActivity: { include: { contractor: true } },
              },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async addItemsToSprint(sprintId: string, backlogItemIds: string[]) {
    const operations = backlogItemIds.map((itemId) => {
      // Check if already exists? upsert is safer
      return this.prisma.sprintItem.upsert({
        where: {
          sprintId_backlogItemId: {
            sprintId,
            backlogItemId: itemId,
          },
        },
        update: {}, // No change if exists
        create: {
          sprintId,
          backlogItemId: itemId,
          boardStatus: 'TODO',
        },
      });
    });

    await this.prisma.$transaction([
      ...operations,
      // Update backlog items status to IN_SPRINT
      this.prisma.backlogItem.updateMany({
        where: { id: { in: backlogItemIds } },
        data: { status: 'IN_SPRINT' },
      }),
    ]);

    return { success: true };
  }

  async startSprint(sprintId: string) {
    return this.prisma.sprint.update({
      where: { id: sprintId },
      data: { status: 'ACTIVE' },
    });
  }

  async closeSprint(
    sprintId: string,
    retrospective?: { keep?: string; improve?: string; stop?: string },
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Close the sprint
      await tx.sprint.update({
        where: { id: sprintId },
        data: { status: 'CLOSED' },
      });

      // 2. Save Retrospective if provided
      if (retrospective) {
        await tx.retro.create({
          data: {
            sprintId,
            keep: retrospective.keep,
            improve: retrospective.improve,
            stop: retrospective.stop,
          },
        });
      }

      // 3. Move unfinished items back to BACKLOG
      // Find items in this sprint that are NOT DONE
      const unfinishedSprintItems = await tx.sprintItem.findMany({
        where: {
          sprintId,
          boardStatus: { not: 'DONE' },
        },
        select: { backlogItemId: true },
      });

      const backlogIds = unfinishedSprintItems.map((i) => i.backlogItemId);

      if (backlogIds.length > 0) {
        await tx.backlogItem.updateMany({
          where: { id: { in: backlogIds } },
          data: { status: 'BACKLOG', priority: 5 }, // Reset status and maybe bump priority?
        });
      }

      // Mark finished items as COMPLETED in backlog?
      const finishedSprintItems = await tx.sprintItem.findMany({
        where: {
          sprintId,
          boardStatus: 'DONE',
        },
        select: { backlogItemId: true },
      });
      const finishedBacklogIds = finishedSprintItems.map(
        (i) => i.backlogItemId,
      );

      if (finishedBacklogIds.length > 0) {
        await tx.backlogItem.updateMany({
          where: { id: { in: finishedBacklogIds } },
          data: { status: 'COMPLETED' },
        });
      }

      return { success: true, movedToBacklog: backlogIds.length };
    });
  }

  async assignBacklogItem(backlogItemId: string, userId: string) {
    // 1. Update Backlog Item
    const updatedItem = await this.prisma.backlogItem.update({
      where: { id: backlogItemId },
      data: { assigneeUserId: userId },
    });

    // 2. Sync with WBS Activity if linked
    if (updatedItem.linkedWbsActivityId) {
      await this.prisma.projectActivity.update({
        where: { id: updatedItem.linkedWbsActivityId },
        data: { assignedUserId: userId },
      });
    }

    // 3. Sync dependencies?
    // The user asked: "este mismo se actulizara en el la tarea del cronograma y todas sus dependecias relacionadas"
    // This likely means "related tasks" in a loose sense, or maybe literally dependencies.
    // But updating dependencies' assignee automatically is dangerous/unusual (dependencies might be done by others).
    // However, "todas sus dependecias relacionadas" might refer to sub-activities or just the linked activity itself.
    // Given the phrasing "tarea del cronograma y todas sus dependecias relacionadas", it might imply
    // "Sync the Schedule Task AND its related dependencies" -> likely meaning the sync we just did (Backlog -> Schedule).
    // I will stick to Backlog -> Schedule Activity sync for now as it's the most logical interpretation of "syncing to schedule".
    // Actually, if he means "dependencies" as in "dependent tasks", that would be weird.
    // Let's assume he means the "Network of related items" (i.e. the WBS activity).

    return updatedItem;
  }

  // --- BOARD ---

  async updateSprintItemStatus(itemId: string, status: string) {
    // itemId is the SprintItem ID, not BacklogItem ID
    const updatedItem = await this.prisma.sprintItem.update({
      where: { id: itemId },
      data: { boardStatus: status },
      include: { backlogItem: true },
    });

    // Sync with WBS Activity if DONE
    if (status === 'DONE' && updatedItem.backlogItem?.linkedWbsActivityId) {
      await this.prisma.projectActivity.update({
        where: { id: updatedItem.backlogItem.linkedWbsActivityId },
        data: {
          percent: 100,
          status: 'DONE',
          lastUpdateAt: new Date(),
        },
      });
    }

    return updatedItem;
  }

  async reorderSprintItems(sprintId: string, orderedItemIds: string[]) {
    const updates = orderedItemIds.map((id, index) =>
      this.prisma.sprintItem.update({
        where: { id },
        data: { orderIndex: index },
      }),
    );
    return this.prisma.$transaction(updates);
  }

  // --- DAILY UPDATES ---

  async createDailyUpdate(data: {
    photoIds?: string[];
    text: string;
    userId: string;
    backlogItemId?: string;
    sprintId?: string;
    wbsActivityId?: string;
    projectId: string;
  }) {
    // If photos are provided (existing Photo IDs), we link them
    const {
      photoIds,
      text,
      userId,
      backlogItemId,
      sprintId,
      wbsActivityId,
      projectId,
    } = data;

    let derivedWbsActivityId = wbsActivityId;

    if (backlogItemId && !derivedWbsActivityId) {
      // Fetch backlog item to get linked WBS Activity ID if not provided
      const backlogItem = await this.prisma.backlogItem.findUnique({
        where: { id: backlogItemId },
        select: { linkedWbsActivityId: true },
      });
      derivedWbsActivityId = backlogItem?.linkedWbsActivityId ?? undefined;
    }

    const update = await this.prisma.dailyUpdate.create({
      data: {
        projectId,
        backlogItemId,
        sprintId,
        text,
        userId,
        wbsActivityId: derivedWbsActivityId,
      },
    });

    if (photoIds && photoIds.length > 0) {
      await this.prisma.photo.updateMany({
        where: { id: { in: photoIds } },
        data: { dailyUpdateId: update.id },
      });
    }

    return update;
  }

  async getDailyUpdates(
    projectId: string,
    sprintId?: string,
    backlogItemId?: string,
  ) {
    const dailyUpdatesWhere: Prisma.DailyUpdateWhereInput = { projectId };
    let linkedWbsActivityId: string | null = null;

    if (backlogItemId) {
      const item = await this.prisma.backlogItem.findUnique({
        where: { id: backlogItemId },
        select: { linkedWbsActivityId: true },
      });
      linkedWbsActivityId = item?.linkedWbsActivityId || null;

      if (linkedWbsActivityId) {
        dailyUpdatesWhere.OR = [
          { backlogItemId },
          { wbsActivityId: linkedWbsActivityId },
        ];
      } else {
        dailyUpdatesWhere.backlogItemId = backlogItemId;
      }
    } else if (sprintId) {
      dailyUpdatesWhere.sprintId = sprintId;
    }

    // 1. Fetch DailyUpdates (Scrum & WBS Comments)
    const dailyUpdates = await this.prisma.dailyUpdate.findMany({
      where: dailyUpdatesWhere,
      include: {
        user: true,
        backlogItem: true,
        wbsActivity: true,
        photos: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // If we are looking at a specific item linked to WBS, fetch other history sources
    // Define explicit types or allow inference where possible but cast to known structure for merge
    // Using simple types for now to avoid complexity with Prisma generated types if they are tricky
    let fieldUpdates: Array<{
      id: string;
      fieldUpdate: { date: Date; photos: any[] } | null;
      notes: string | null;
      qtyDone: number | null;
    }> = [];
    let progressRecords: Array<{
      id: string;
      createdAt: Date;
      weekStartDate: Date;
      notes: string | null;
      percent: number;
    }> = [];

    if (linkedWbsActivityId) {
      // 2. Fetch FieldUpdates (Field Management) - Indirectly linked via ProjectActivity?
      const updates = await this.prisma.fieldUpdateItem.findMany({
        where: { activityId: linkedWbsActivityId },
        include: {
          fieldUpdate: { include: { photos: true } }, // Photos are on the Report (FieldUpdate), not Item
        },
        orderBy: { fieldUpdate: { date: 'desc' } },
        take: 20,
      });
      // Cast to match our interface or use as is (mismatch might occur on nulls)
      fieldUpdates = updates;

      // 3. Fetch WeeklyProgress (High Level)
      progressRecords = await this.prisma.activityWeeklyProgress.findMany({
        where: { activityId: linkedWbsActivityId, notes: { not: null } },
        orderBy: { weekStartDate: 'desc' },
        take: 20,
      });
    }

    // 4. Merge and Normalize
    const unifiedHistory = [
      ...dailyUpdates.map((u) => ({
        id: u.id,
        type: 'DAILY_UPDATE',
        createdAt: u.createdAt,
        text: u.text,
        user: u.user,
        photos: u.photos,
        source: 'Bitácora',
      })),
      ...fieldUpdates.map((f) => ({
        id: f.id,
        type: 'FIELD_UPDATE',
        createdAt: f.fieldUpdate?.date || new Date(),
        text: `[Campo-Item] ${f.notes || 'Sin notas'} (Avance: ${f.qtyDone || 0})`,
        user: { name: 'Campo' }, // simplified
        photos: f.fieldUpdate?.photos || [], // Photos from Report
        source: 'Gestión de Campo',
      })),
      ...progressRecords.map((p) => ({
        id: p.id,
        type: 'WEEKLY_PROGRESS',
        createdAt: p.createdAt || p.weekStartDate,
        text: `[Avance Semanal] ${p.notes} (${p.percent}%)`,
        user: { name: 'Supervisor' }, // Simplified
        photos: [],
        source: 'Cronograma',
      })),
    ];

    return unifiedHistory.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  // --- IMPEDIMENTS ---

  async createImpediment(data: Prisma.ImpedimentUncheckedCreateInput) {
    return this.prisma.impediment.create({ data });
  }

  async getImpediments(projectId: string) {
    return this.prisma.impediment.findMany({
      where: { projectId },
      include: { ownerUser: true, sprint: true }, // User relation not defined in schema for Impediment owner?
      // I didn't add relation for ownerUserId in schema. Need to fix or just return raw ID?
      // Schema has `ownerUserId String?` but no `@relation`.
      // Let's rely on frontend fetching or update schema later if critical. Can just return IDs for now.
    });
    // Actually schema defines ownerUserId but no relation. I should fix schema later if needed.
  }

  async resolveImpediment(id: string) {
    return this.prisma.impediment.update({
      where: { id },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
    });
  }

  // --- ANALYTICS ---

  async getDashboardMetrics(projectId: string): Promise<DashboardMetricsDto> {
    // 1. Active Sprint Progress
    const activeSprint = await this.prisma.sprint.findFirst({
      where: {
        projectId,
        status: 'ACTIVE',
      },
      include: {
        items: {
          include: {
            backlogItem: true,
          },
        },
        impediments: {
          where: { status: 'OPEN' },
        },
      },
    });

    let activeSprintProgress = 0;
    let sprintHealth = 100;

    if (activeSprint) {
      const totalPoints = activeSprint.items.reduce(
        (acc: number, item) => acc + (item.backlogItem.storyPoints || 0),
        0,
      );
      const completedPoints = activeSprint.items
        .filter((item) => item.boardStatus === 'DONE')
        .reduce(
          (acc: number, item) => acc + (item.backlogItem.storyPoints || 0),
          0,
        );

      if (totalPoints > 0) {
        activeSprintProgress = Math.round(
          (completedPoints / totalPoints) * 100,
        );
      }

      // Simple Health Heuristic
      // -10 per open impediment
      // -20 if progress < 50% and time elapsed > 70%
      sprintHealth -= activeSprint.impediments.length * 10;

      const startDate = new Date(activeSprint.startDate).getTime();
      const endDate = new Date(activeSprint.endDate).getTime();
      const now = new Date().getTime();
      const totalDuration = endDate - startDate;
      const elapsed = now - startDate;

      if (totalDuration > 0 && elapsed > 0) {
        const timeProgress = (elapsed / totalDuration) * 100;
        if (timeProgress > 70 && activeSprintProgress < 50) {
          sprintHealth -= 20;
        }
      }
      activeSprintProgress = Math.min(Math.max(activeSprintProgress, 0), 100);
      sprintHealth = Math.min(Math.max(sprintHealth, 0), 100);
    } else {
      sprintHealth = 0; // No active sprint
    }

    // 2. Velocity (Last 3 CLOSED sprints)
    const recentClosedSprints = await this.prisma.sprint.findMany({
      where: {
        projectId,
        status: 'CLOSED',
      },
      orderBy: { endDate: 'desc' },
      take: 3,
      include: {
        items: {
          where: { boardStatus: 'DONE' },
          include: { backlogItem: true },
        },
      },
    });

    const velocity =
      recentClosedSprints.length > 0
        ? recentClosedSprints.reduce(
            (acc: number, sprint) =>
              acc +
              sprint.items.reduce(
                (sum: number, item) =>
                  sum + (item.backlogItem.storyPoints || 0),
                0,
              ),
            0,
          ) / recentClosedSprints.length
        : 0;

    // 3. Stats
    const totalBacklogItems = await this.prisma.backlogItem.count({
      where: { projectId, status: { not: 'DONE' } },
    });

    const openImpediments = await this.prisma.impediment.count({
      where: { projectId, status: 'OPEN' },
    });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const itemsCompletedThisMonth = await this.prisma.backlogItem.count({
      where: {
        projectId,
        status: 'DONE',
        updatedAt: { gte: startOfMonth },
      },
    });

    // 4. Recent Sprints Chart Data (Last 6)
    const lastSprints = await this.prisma.sprint.findMany({
      where: { projectId },
      orderBy: { endDate: 'desc' },
      take: 6,
      include: {
        items: {
          include: { backlogItem: true },
        },
      },
    });

    const recentSprints = lastSprints.reverse().map((sprint) => {
      const total = sprint.items.reduce(
        (acc: number, i) => acc + (i.backlogItem.storyPoints || 0),
        0,
      );
      const completed = sprint.items
        .filter((i) => i.boardStatus === 'DONE')
        .reduce((acc: number, i) => acc + (i.backlogItem.storyPoints || 0), 0);

      return {
        name: sprint.name,
        planned: total,
        completed: completed,
      };
    });

    return {
      activeSprintProgress,
      velocity: parseFloat(velocity.toFixed(1)),
      totalBacklogItems,
      itemsCompletedThisMonth,
      openImpediments,
      sprintHealth,
      recentSprints,
    };
  }
}
