import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: { contains: 'dayana' } },
  });
  console.log('Dayana user:', user);

  const contractors = await prisma.contractor.findMany({
    where: { name: { contains: 'SmartBusiness' } },
  });
  console.log('SmartBusiness contractors:', contractors);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
