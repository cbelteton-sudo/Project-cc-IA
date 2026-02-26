import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Starting Member Access Fix...');

  const projects = await prisma.project.findMany();
  const users = await prisma.user.findMany();

  console.log(`Found ${projects.length} projects and ${users.length} users.`);

  for (const project of projects) {
    console.log(`Processing Project: ${project.name} (${project.id})`);

    for (const user of users) {
      const membership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: project.id,
            userId: user.id,
          },
        },
      });

      if (!membership) {
        console.log(`   - Adding user ${user.email} as PROJECT_ADMIN`);
        await prisma.projectMember.create({
          data: {
            projectId: project.id,
            userId: user.id,
            role: 'PROJECT_ADMIN', // Give everyone admin rights for dev
            status: 'ACTIVE',
          },
        });
      } else {
        // Ensure status is ACTIVE
        if (membership.status !== 'ACTIVE') {
          console.log(`   - Reactivating user ${user.email}`);
          await prisma.projectMember.update({
            where: { id: membership.id },
            data: { status: 'ACTIVE' },
          });
        }
      }
    }
  }

  console.log('✅ Access Fix Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
