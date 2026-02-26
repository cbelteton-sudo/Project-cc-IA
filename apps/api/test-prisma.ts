import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
      enableScrum: true,
      enableBudget: true,
      enableFieldManagement: true,
    },
  });
  console.dir(projects, { depth: null });
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
