import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.project.updateMany({
    where: {
      currency: {
        not: 'GTQ'
      }
    },
    data: {
      currency: 'GTQ'
    }
  });
  console.log(`Updated ${result.count} projects to GTQ`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
