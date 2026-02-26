import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  console.log('Fetching projects...');
  const projects = await prisma.project.findMany({
    include: { projectManager: true },
  });
  console.log('Found projects:', projects.length);
  const result = projects.map((p) => ({
    id: p.id,
    name: p.name,
    projectManagerId: p.projectManagerId,
    managerName_from_relation: p.projectManager?.name,
    managerName_physical: p.managerName,
  }));
  console.log(JSON.stringify(result, null, 2));
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
