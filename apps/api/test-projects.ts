import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'operador1@demo.com' },
  });
  if (!user) return console.log('user not found');
  console.log('user', user);

  const projects = await prisma.project.findMany({
    where: {
      tenantId: user.tenantId,
      members: {
        some: {
          userId: user.id,
        },
      },
    },
    include: {
      projectManager: {
        select: { name: true },
      },
    },
  });
  console.log('projects', projects);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
