const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMetrics() {
  try {
    const projectId = 'FIELD_DEMO_UAT'; // Use a known project ID
    const daysWithoutUpdate = 3;
    const today = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(today.getDate() - daysWithoutUpdate);

    let stalledActivities = [];

    const activeActivities = await prisma.projectActivity.findMany({
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

    const recentEntries = await prisma.fieldDailyEntry.findMany({
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
        const highIssues = a.issues.filter((i) => i.severity === 'HIGH').length;
        const medIssues = a.issues.filter(
          (i) => i.severity === 'MEDIUM',
        ).length;
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
      .slice(0, 50);

    const blockedActivities = await prisma.fieldDailyEntry.findMany({
      where: {
        dailyReport: { projectId },
        status: 'BLOCKED',
        dailyReportId: {
          in: (
            await prisma.fieldDailyReport.findMany({
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

    const issuecounts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    const issues = await prisma.issue.groupBy({
      by: ['severity'],
      where: { projectId, status: { not: 'DONE' } },
      _count: { id: true },
    });

    issues.forEach((i) => {
      if (i.severity in issuecounts) issuecounts[i.severity] = i._count.id;
    });

    const result = {
      stalled: { count: stalledActivities.length, items: stalledActivities },
      blocked: {
        count: blockedActivities.length,
        items: blockedActivities.map((b) => ({
          id: b.scheduleActivityId,
          name: b.activityName || b.activity?.name,
          date: b.updatedAt,
          note: b.note,
        })),
      },
      issues: issuecounts,
    };

    console.log('SUCCESS:', result);
  } catch (err) {
    console.error('ERROR ENCOUNTERED:');
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

testMetrics();
