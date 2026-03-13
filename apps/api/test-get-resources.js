const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const tenantId = '7836bb4b-ce62-4c28-a1c8-bb0295cb6b5a';
  const contractorId = 'c6a328db-3d04-43dc-a132-479cb5e2cf23';

  console.log('Fetching contractor with:', { tenantId, contractorId });
  const contractor = await prisma.contractor.findFirst({
    where: { id: contractorId, tenantId },
  });
  console.log('Contractor:', contractor ? contractor.name : 'NOT FOUND');

  const manualResources = await prisma.contractorResource.findMany({
    where: { tenantId, contractorId },
    orderBy: { createdAt: 'desc' },
  });
  console.log('Manual Resources:', manualResources.length);

  const users = await prisma.user.findMany({
    where: { tenantId, contractorId },
    orderBy: { createdAt: 'desc' },
  });
  console.log('Users:', users.length);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
