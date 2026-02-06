
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Debug Start ---');
    const tenants = await prisma.tenant.findMany();
    console.log('Tenants:', JSON.stringify(tenants, null, 2));

    const user = await prisma.user.findUnique({ where: { email: 'alfredo@demo.com' } });
    if (user) {
        console.log('❌ User alfredo@demo.com ALREADY EXISTS:', user.id);
    } else {
        console.log('✅ User alfredo@demo.com does NOT exist.');
    }

    const allUsers = await prisma.user.findMany();
    console.log('Total Users:', allUsers.length);
    console.log('--- Debug End ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
