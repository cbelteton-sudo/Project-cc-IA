import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const projects = await prisma.project.findMany({
    select: { id: true, name: true },
  });
  console.log('Projects:', projects);
  const items = await prisma.backlogItem.count();
  const activities = await prisma.projectActivity.count();
  console.log('Total BacklogItems in DB:', items);
  console.log('Total ProjectActivities in DB:', activities);
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
