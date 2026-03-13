import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findUnique({
      where: { id: "4bd25a42-c88f-4ef8-acbf-5523fdce2b74" }, // Complejo Logistico del Sur
      include: {
        budgets: true,
        projectManager: {
          select: { name: true },
        },
        mainContractor: {
          select: { name: true },
        },
      },
  });
  console.log(JSON.stringify({
      ...project,
      managerName: (project as any).projectManager?.name,
      constructorName: (project as any).mainContractor?.name,
  }, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
