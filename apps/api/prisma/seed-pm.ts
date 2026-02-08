
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'pm@cconstructions.com';
    const password = 'password123';
    const name = 'Gerente de Proyectos';

    // 1. Get Tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        console.error('No tenant found. Run seed first.');
        return;
    }

    // 2. Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        console.log(`User ${email} already exists. Updating role to PM...`);
        await prisma.user.update({
            where: { email },
            data: { role: 'PM' },
        });
        console.log('User role updated to PM.');
        return;
    }

    // 3. Create User
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
            role: 'PM', // Explicitly setting role from schema enum
            tenantId: tenant.id,
        },
    });

    console.log(`
  ✅ PM Profile Created Successfully!
  -----------------------------------
  Email: ${email}
  Password: ${password}
  Role: PM
  Tenant: ${tenant.name}
  -----------------------------------
  `);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
