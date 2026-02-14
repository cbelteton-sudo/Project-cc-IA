import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const items = await prisma.backlogItem.findMany({
    where: {
      projectId: { not: undefined }, // Get all
    },
    select: {
      id: true,
      title: true,
      status: true,
      isUrgent: true,
      isImportant: true,
    },
  });

  console.log('Total Items:', items.length);
  console.log('Items:', JSON.stringify(items, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
