import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@demo.com';
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log(`User ID: ${user.id}`);

  // Check specific session from error
  const specificId = 'ab613b50-598c-4042-8187-30a44be6d84c';
  const specificSession = await prisma.session.findUnique({
    where: { id: specificId },
  });
  if (specificSession) {
    console.log('--- SPECIFIC SESSION REPORT ---');
    console.log(`ID: ${specificSession.id}`);
    console.log(`Created: ${specificSession.createdAt.toISOString()}`);
    console.log(
      `Revoked: ${specificSession.revokedAt ? specificSession.revokedAt.toISOString() : 'ACTIVE'}`,
    );
    console.log('-------------------------------');
  }

  const sessions = await prisma.session.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  console.log('Last 10 Sessions:');
  sessions.forEach((s) => {
    console.log(
      `ID: ${s.id} | Created: ${s.createdAt.toISOString()} | Revoked: ${s.revokedAt ? s.revokedAt.toISOString() : 'ACTIVE'} | IP: ${s.ipAddress}`,
    );
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
