import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@demo.com';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log('Seeding Admin User...');

  // 1. Ensure Tenant
  let tenant = await prisma.tenant.findUnique({ where: { slug: 'default' } });
  if (!tenant) {
    // Try to find ANY tenant if default doesn't exist
    tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Default Tenant',
          slug: 'default',
        },
      });
      console.log('Created Default Tenant');
    }
  }

  // 2. Ensure Admin
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (!existingUser) {
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'System Admin',
        role: 'ADMIN',
        tenantId: tenant.id,
      },
    });
    console.log(`Admin user created: ${email} / ${password}`);
  } else {
    // Update password to ensure it matches documentation
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        role: 'ADMIN', // Ensure role is ADMIN
      },
    });
    console.log(`Admin user updated: ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
