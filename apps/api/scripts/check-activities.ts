import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to the database...');
  const activities = await prisma.projectActivity.findMany({
    where: { projectId: 'd171b59f-f1a5-4681-9cfe-09c40550802b' },
  });
  console.log('Total activities found for Torre Norte 2:', activities.length);

  const allActivities = await prisma.projectActivity.findMany();
  console.log('Total activities found in DB:', allActivities.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
