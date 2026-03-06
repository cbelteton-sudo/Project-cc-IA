import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findFirst();
  if (!project) throw new Error('No project found');

  const user = await prisma.user.findFirst();
  if (!user) throw new Error('No user found');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  console.log('Creating report for project', project.id, 'user', user.id);

  try {
    let report = await prisma.fieldDailyReport.findFirst({
      where: {
        projectId: project.id,
        date: today,
      },
    });
    if (!report) {
      report = await prisma.fieldDailyReport.create({
        data: {
          projectId: project.id,
          date: today,
          createdBy: user.id,
          status: 'DRAFT',
        },
      });
    }
    console.log('Report created/found:', report.id);

    const entry = await prisma.fieldDailyEntry.create({
      data: {
        dailyReportId: report.id,
        activityName: 'Test Entry',
        wbs: undefined,
        status: 'ON_TRACK', // this is what's failing!
        progressChip: undefined,
        note: 'Test description',
        createdBy: user.id,
      },
    });
    console.log('Entry created:', entry.id);
  } catch (e) {
    console.error(e);
  }
}

main().finally(() => prisma.$disconnect());
