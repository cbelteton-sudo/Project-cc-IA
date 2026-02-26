import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const projectId = 'db746ec5-c375-47cd-b53c-d29cdfab471e'; // TORRE MAWI DEMO

  console.log(`Checking project ${projectId}...`);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    console.error('Project not found!');
    return;
  }

  console.log('Current status:', {
    name: project.name,
    enableScrum: project.enableScrum,
  });

  if (!project.enableScrum) {
    console.log('Enabling Scrum...');
    await prisma.project.update({
      where: { id: projectId },
      data: { enableScrum: true },
    });
    console.log('Scrum enabled successfully.');
  } else {
    console.log('Scrum is already enabled.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
