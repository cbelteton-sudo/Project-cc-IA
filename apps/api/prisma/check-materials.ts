import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    const tenants = await prisma.tenant.findMany({
        include: {
            _count: {
                select: { materials: true }
            }
        }
    });

    console.log('Tenants found:', tenants.length);
    tenants.forEach(t => {
        console.log(`- Tenant: ${t.name} (ID: ${t.id})`);
        console.log(`  Materials: ${t._count.materials}`);
    });
}

check()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
