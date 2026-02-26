import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { contains: 'dayana' } },
  });
  console.log('Dayanas:', users);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
