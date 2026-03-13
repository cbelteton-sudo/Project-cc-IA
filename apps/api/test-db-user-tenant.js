const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("Fetching PM User 'Heisel Giron'...");
  const user = await prisma.user.findFirst({
    where: { name: { contains: 'Heisel' } },
  });

  console.log(JSON.stringify(user, null, 2));

  console.log('\nFetching Project PM for Estructura project...');
  const project = await prisma.project.findFirst({
    where: { id: 'd171b59f-f1a5-4681-9cfe-09c40550802b' }, // From the contractor's projectId
    include: { projectTeam: { include: { user: true } } },
  });

  console.log(JSON.stringify(project?.projectTeam, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
