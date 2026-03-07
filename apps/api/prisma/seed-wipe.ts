import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting full database wipe...');

  // 1. Truncate all tables from Tenant down using CASCADE.
  // This is a PostgreSQL specific command that safely deletes all dependent rows.
  // Note: Only run this in Demo/Staging environments!
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Tenant" CASCADE;`);
  console.log('✅ Wiped all data (Tenants, Users, Projects, Tasks, etc).');

  // 2. Create the default/demo Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Constructora Demo',
      slug: 'demo',
    },
  });
  console.log('✅ Created default Tenant: Constructora Demo');

  // 3. Create the Sudo Administrator Platform User
  const password = await bcrypt.hash('Vg45&5L-F.xE5M$', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'administrator@fluxori.io',
      password,
      name: 'Carlos Beltetón',
      role: 'ADMIN',
      tenantId: tenant.id,
      status: 'ACTIVE',
    },
  });
  console.log('✅ Sudo Administrator created: administrator@fluxori.io');
}

main()
  .catch((e) => {
    console.error('❌ Error during wipe and seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('✨ Database wipe and initialization complete!');
  });
