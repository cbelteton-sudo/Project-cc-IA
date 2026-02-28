const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const projectId = 'FIELD_DEMO_UAT'; // We saw this ID in previous shells maybe, but let's just use any project ID
    const activeActivities = await prisma.projectActivity.findMany({
      where: {
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
      take: 2,
    });
    console.log('Success!', activeActivities);
  } catch (err) {
    console.error('CAUGHT ERROR:');
    console.error(err.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
