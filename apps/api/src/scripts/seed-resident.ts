import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'residente@demo.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Ensure tenant exists (from seed usually)
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        tenant = await prisma.tenant.create({
            data: {
                name: 'Constructora Demo',
                slug: 'demo-tenant'
            }
        });
    }

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            role: 'RESIDENTE',
            name: 'Residente de Obra'
        },
        create: {
            email,
            name: 'Residente de Obra',
            password: hashedPassword,
            role: 'RESIDENTE',
            tenantId: tenant.id
        }
    });

    console.log(`User created: ${user.email} with role ${user.role}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
