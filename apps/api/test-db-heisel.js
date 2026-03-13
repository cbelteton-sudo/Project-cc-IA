const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const user = await prisma.user.findFirst({
      where: { name: { contains: 'Heisel' } },
    });

    if (!user) {
      console.log('Could not find Heisel Giron');
      return;
    }

    console.log(`Found user: ${user.email}`);

    // Assuming we can't test password, let's just observe the role
    console.log(`Role: ${user.role}, Tenant: ${user.tenantId}`);

    // Check if the getResources endpoint has ANY role guard
    // It doesn't, it just uses UseGuards(JwtAuthGuard)
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
