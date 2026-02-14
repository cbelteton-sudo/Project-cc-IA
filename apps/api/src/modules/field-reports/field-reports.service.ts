import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FieldReportsService {
  constructor(private prisma: PrismaService) {}

  async getTodayReport(projectId: string, userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Try to find existing report
    let report = await this.prisma.fieldDailyReport.findUnique({
      where: {
        projectId_date: {
          projectId,
          date: today,
        },
      },
      include: {
        entries: {
          include: {
            photos: true,
          },
        },
      },
    });

    // 2. Create if not exists
    if (!report) {
      report = await this.prisma.fieldDailyReport.create({
        data: {
          projectId,
          date: today,
          createdBy: userId,
          status: 'DRAFT',
        },
        include: {
          entries: {
            include: {
              photos: true,
            },
          },
        },
      });
    }

    return report;
  }

  async upsertEntry(dto: any, userId: string = 'SYNC_SYSTEM') {
    // Determine status based on input or logic
    let {
      dailyReportId,
      scheduleActivityId,
      activityName,
      status,
      progressChip,
      note,
      wbs,
      projectId,
      dateString,
      createdBy,
    } = dto;

    // Use provided createdBy (from offline capture) or fallback to current user
    const authorId = createdBy || userId;

    // 0. Ensure Daily Report exists (Robust Sync)
    if (projectId && dateString) {
      const date = new Date(dateString);

      // Try to find by unique constraint first
      let report = await this.prisma.fieldDailyReport.findUnique({
        where: { projectId_date: { projectId, date } },
      });

      if (!report) {
        // If ID provided, try to use it (unless collision?)
        // Actually, if we are here, no report exists for this day.
        // We can safely create one.
        report = await this.prisma.fieldDailyReport
          .create({
            data: {
              id: dailyReportId, // Try to respect Frontend ID if possible, else let Prisma gen?
              // If we use frontend ID, we might collide if user resets?
              // Safer to let backend manage or upsert?
              // If we strictly want offline sync, we should use the ID if provided.
              projectId,
              date,
              createdBy: userId,
              status: 'DRAFT',
            },
          })
          .catch(async (e) => {
            // Race condition?
            return this.prisma.fieldDailyReport.findUnique({
              where: { projectId_date: { projectId, date } },
            });
          });
      }

      // Update dailyReportId to the REAL one (in case we found an existing one)
      if (report) dailyReportId = report.id;
    }

    // Check if entry exists for this activity in this report
    const existingEntry = await this.prisma.fieldDailyEntry.findFirst({
      where: {
        dailyReportId,
        scheduleActivityId,
      },
    });

    let entry;

    if (existingEntry) {
      entry = await this.prisma.fieldDailyEntry.update({
        where: { id: existingEntry.id },
        data: {
          status,
          progressChip,
          note,
          updatedAt: new Date(),
          createdBy: authorId,
        },
      });
    } else {
      entry = await this.prisma.fieldDailyEntry.create({
        data: {
          dailyReportId,
          scheduleActivityId,
          activityName,
          wbs,
          status,
          progressChip,
          note,
          createdBy: authorId,
        },
      });
    }

    // Update Activity lastUpdateAt & Status/Percent (Real-time Sync)
    if (scheduleActivityId) {
      const updateData: any = { lastUpdateAt: new Date() };

      // GAP FIX: Sync Status and Percent
      if (status) updateData.status = status;
      if (progressChip !== undefined) updateData.percent = Number(progressChip);

      // Auto-complete logic
      if (status === 'DONE') {
        updateData.percent = 100;
        updateData.manualProgress = 100;
      }

      await this.prisma.projectActivity
        .update({
          where: { id: scheduleActivityId },
          data: updateData,
        })
        .catch((e) => console.error('Failed to sync activity status', e));
    }

    // Handle Photos (Base64)
    if (dto.photos && Array.isArray(dto.photos) && dto.photos.length > 0) {
      const photoList = dto.photos as any[];
      for (const p of photoList) {
        // Check if photo exists
        const existingPhoto = await this.prisma.photo.findUnique({
          where: { id: p.id },
        });
        if (!existingPhoto) {
          // Ensure we have projectId
          let validProjectId = projectId;
          if (!validProjectId && dailyReportId) {
            const dr = await this.prisma.fieldDailyReport.findUnique({
              where: { id: dailyReportId },
              select: { projectId: true },
            });
            if (dr) validProjectId = dr.projectId;
          }

          if (validProjectId) {
            await this.prisma.photo
              .create({
                data: {
                  id: p.id,
                  urlMain: p.base64,
                  urlThumb: p.base64,
                  dailyEntryId: entry.id, // Correct relation
                  projectId: validProjectId,
                  createdBy: authorId,
                },
              })
              .catch((e) => console.error('Failed to save photo', e));
          } else {
            console.warn('Skipping photo save: Missing Project ID');
          }
        }
      }
    }

    return entry;
  }

  async submitReport(id: string, userId: string) {
    return this.prisma.fieldDailyReport.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });
  }

  async generatePdf(reportId: string) {
    // Mock PDF generation logic
    // In a real app, use 'pdfkit' or similar to generate a stream
    return {
      url: `http://localhost:4180/api/reports/${reportId}.pdf`, // Mock URL
      generatedAt: new Date(),
    };
  }

  async getActivityLog(activityId: string, limit: number = 20) {
    // 1. Fetch Field Entries
    const fieldEntries = await this.prisma.fieldDailyEntry.findMany({
      where: { scheduleActivityId: activityId },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      include: {
        dailyReport: {
          select: { date: true },
        },
        photos: {
          select: { id: true, urlThumb: true, urlMain: true },
        },
      },
    });

    // 2. Fetch Scrum Daily Updates linked to this WBS Activity
    const scrumUpdates = await this.prisma.dailyUpdate.findMany({
      where: { wbsActivityId: activityId },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      include: {
        user: { select: { id: true, name: true } },
        photos: {
          select: { id: true, urlMain: true, urlThumb: true },
        },
      },
    });

    // 3. Get User Names for Field Entries
    const userIds = [
      ...new Set(
        fieldEntries
          .map((e) => e.createdBy)
          .filter((id): id is string => id !== null),
      ),
    ];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    // 4. Map and Merge
    const mappedFieldEntries = fieldEntries.map((e) => ({
      id: e.id,
      date: e.dailyReport.date,
      status: e.status,
      progressChip: e.progressChip,
      note: e.note,
      createdAt: e.createdAt,
      createdBy: e.createdBy,
      authorName: (e.createdBy ? userMap.get(e.createdBy) : null) || 'Usuario',
      source: 'FIELD',
      photos: e.photos,
      photosCount: e.photos.length,
    }));

    const mappedScrumUpdates = scrumUpdates.map((u: any) => ({
      id: u.id,
      date: u.createdAt, // Scrum updates don't have separate date field yet, use createdAt
      status: 'SCRUM_UPDATE', // specific status tag
      progressChip: null,
      note: u.text,
      createdAt: u.createdAt,
      createdBy: u.userId,
      authorName: u.user?.name || 'Usuario',
      source: 'SCRUM',
      photos: u.photos.map((p: any) => ({
        id: p.id,
        urlThumb: p.urlThumb || p.urlMain,
        urlMain: p.urlMain,
      })),
      photosCount: u.photos.length,
    }));

    // Merge and Sort
    const allItems = [...mappedFieldEntries, ...mappedScrumUpdates].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return allItems.slice(0, limit);
  }

  async getActivityPhotos(activityId: string, limit: number = 50) {
    // Optimized for just photos gallery
    const photos = await this.prisma.photo.findMany({
      where: {
        dailyEntry: {
          scheduleActivityId: activityId,
        },
      },
      take: Number(limit),
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        urlThumb: true,
        urlMain: true,
        uploadedAt: true,
        dailyEntry: {
          select: {
            dailyReport: {
              select: { date: true },
            },
          },
        },
      },
    });

    return photos.map((p) => ({
      id: p.id,
      urlThumb: p.urlThumb,
      urlMain: p.urlMain,
      createdAt: p.uploadedAt,
      date: p.dailyEntry?.dailyReport.date,
    }));
  }

  async getPMDashboardMetrics(
    projectId: string,
    daysWithoutUpdate: number = 3,
  ) {
    console.log(`[PM Dashboard] Fetching metrics for project: ${projectId}`);
    const today = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(today.getDate() - daysWithoutUpdate);

    // 1. No Update in X Days (Enriched)
    let stalledActivities: any[] = [];

    if (projectId) {
      // Fetch active activities with Issue counts and Last Entry status
      const activeActivities = await this.prisma.projectActivity.findMany({
        where: {
          projectId,
          status: { not: 'DONE' },
        },
        select: {
          id: true,
          name: true,
          code: true,
          issues: {
            where: { status: { not: 'DONE' } },
            select: { severity: true },
          },
          fieldDailyEntries: {
            take: 1,
            orderBy: { dailyReport: { date: 'desc' } },
            select: { status: true },
          },
        },
      });

      // Find entries since cutoff to identify which are "active"
      const recentEntries = await this.prisma.fieldDailyEntry.findMany({
        where: {
          dailyReport: {
            projectId,
            date: { gte: cutoffDate },
          },
        },
        select: { scheduleActivityId: true },
      });

      const recentActivityIds = new Set(
        recentEntries.map((e) => e.scheduleActivityId).filter(Boolean),
      );

      stalledActivities = activeActivities
        .filter((a) => !recentActivityIds.has(a.id))
        .map((a) => {
          // Process issues
          const highIssues = a.issues.filter(
            (i) => i.severity === 'HIGH',
          ).length;
          const medIssues = a.issues.filter(
            (i) => i.severity === 'MEDIUM',
          ).length;

          // Check if last known status was BLOCKED
          const isBlocked = a.fieldDailyEntries[0]?.status === 'BLOCKED';

          return {
            id: a.id,
            name: a.name,
            code: a.code,
            isBlocked,
            highIssues,
            medIssues,
          };
        })
        .slice(0, 50); // Increased limit as it's now primary/enriched
    }

    // 2. Blocked Activities (explicitly reported as blocked recently)
    const blockedActivities = await this.prisma.fieldDailyEntry.findMany({
      where: {
        dailyReport: { projectId },
        status: 'BLOCKED',
        dailyReportId: {
          in: (
            await this.prisma.fieldDailyReport.findMany({
              where: {
                projectId,
                date: { gte: new Date(Date.now() - 7 * 8400000) },
              },
              select: { id: true },
            })
          ).map((r) => r.id),
        },
      },
      take: 20,
      orderBy: { updatedAt: 'desc' },
      include: { activity: { select: { name: true, code: true } } },
    });

    // 3. Issues Counts
    const issuecounts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    if (projectId) {
      const issues = await this.prisma.issue.groupBy({
        by: ['severity'],
        where: { projectId, status: { not: 'DONE' } },
        _count: { id: true },
      });
      issues.forEach((i) => {
        if (i.severity in issuecounts)
          issuecounts[i.severity as keyof typeof issuecounts] = i._count.id;
      });
    }

    const result = {
      stalled: { count: stalledActivities.length, items: stalledActivities },
      blocked: {
        count: blockedActivities.length,
        items: blockedActivities.map((b) => ({
          id: b.scheduleActivityId,
          name: b.activityName,
          date: b.updatedAt,
          note: b.note,
        })),
      },
      issues: issuecounts,
    };

    console.log(
      '[PM Dashboard] Returning metrics:',
      JSON.stringify(result, null, 2),
    );
    return result;
  }
}
