const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const item = await prisma.backlogItem.findFirst({
    where: { title: 'Definir fecha de instalacion' },
    include: {
      contractor: true,
      linkedWbsActivity: {
        include: {
          contractor: true,
          parent: { include: { contractor: true } },
        },
      },
      parent: {
        include: {
          contractor: true,
          linkedWbsActivity: {
            include: {
              contractor: true,
              parent: { include: { contractor: true } },
            },
          },
        },
      },
    },
  });
  console.log(JSON.stringify(item, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
