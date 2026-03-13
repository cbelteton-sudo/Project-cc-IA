import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: 'demo' } });
  if (!tenant) throw new Error('Tenant demo not found');

  const count = await prisma.contractor.count();
  console.log(`Current contractors: ${count}`);

  if (count === 0) {
    console.log('Restoring contractors...');
    const contractorsData = [
      { name: 'CONSTRUCTORA ALFA', type: 'CONTRACTOR' },
      { name: 'ELECTROMECÁNICA BETA', type: 'CONTRACTOR' },
      { name: 'ACABADOS GAMMA', type: 'CONTRACTOR' },
      { name: 'PROVEEDOR DELTA', type: 'SUPPLIER' },
    ];

    for (const c of contractorsData) {
      await prisma.contractor.create({
        data: { ...c, tenantId: tenant.id },
      });
    }
    console.log(`✅ ${contractorsData.length} Contractors restored!`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
