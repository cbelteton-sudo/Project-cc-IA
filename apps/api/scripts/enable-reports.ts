import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const searchTerm = 'Torre Mawi';
  console.log(`Searching for project with name containing: ${searchTerm}...`);

  const project = await prisma.project.findFirst({
    where: {
      name: {
        contains: searchTerm,
        mode: 'insensitive',
      },
    },
  });

  if (!project) {
    console.error('Project not found!');
    const allProjects = await prisma.project.findMany({
      select: { name: true },
    });
    console.log(
      'Available projects:',
      allProjects.map((p) => p.name),
    );
    process.exit(1);
  }

  console.log(`Found project: ${project.name} (ID: ${project.id})`);
  console.log(`Current enableReports status: ${project.enableReports}`);

  const updated = await prisma.project.update({
    where: { id: project.id },
    data: { enableReports: true },
  });

  console.log(
    `Successfully updated enableReports to: ${updated.enableReports}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
