import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Enabling Scrum for ALL projects...');

  const result = await prisma.project.updateMany({
    data: { enableScrum: true },
  });

  console.log(`Updated ${result.count} projects to enable Scrum.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
