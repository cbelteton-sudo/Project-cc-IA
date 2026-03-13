import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
      include: {
        _count: {
          select: { budgets: true },
        },
        projectManager: {
          select: { name: true },
        },
        mainContractor: {
          select: { name: true },
        },
      },
  });
  console.log(JSON.stringify(projects.map((p) => ({
      ...p,
      managerName: (p as any).projectManager?.name,
      constructorName: (p as any).mainContractor?.name,
  })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
