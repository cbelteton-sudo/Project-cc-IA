const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    where: {
      email: { in: ['admin@demo.com', 'administrator@fluxori.io'] },
    },
    select: { email: true, tenantId: true, role: true },
  });

  console.log('Admins:');
  console.log(JSON.stringify(users, null, 2));

  const contractor = await prisma.contractor.findFirst({
    where: { name: { contains: 'Estructura' } },
    select: { tenantId: true, name: true },
  });

  console.log('Contractor:');
  console.log(JSON.stringify(contractor, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
