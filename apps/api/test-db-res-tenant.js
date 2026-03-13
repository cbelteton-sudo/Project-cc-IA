const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const constr = await prisma.contractor.findFirst({
    where: { name: 'Contratista Estructura' },
  });
  console.log('Contractor ID:', constr.id);
  console.log('Contractor tenantId:', constr.tenantId);

  const res = await prisma.contractorResource.findMany({
    where: { contractorId: constr.id },
  });
  console.log(
    'Resources:',
    res.map((r) => ({ id: r.id, name: r.name, tenantId: r.tenantId })),
  );
}
run().finally(() => prisma.$disconnect());
