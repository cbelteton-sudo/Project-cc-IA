import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  try {
    const projectId = '2a117f0c-0318-493d-9a79-007b4a52cb84';

    // 1. Get Active Sprint
    const sprint = await prisma.sprint.findFirst({
      where: { projectId, status: 'ACTIVE' },
      include: {
        items: {
          include: {
            backlogItem: {
              include: {
                contractor: true,
                parent: {
                  include: { contractor: true },
                },
              },
            },
          },
        },
      },
    });

    if (!sprint) {
      console.log('No active sprint found');
      return;
    }

    console.log(`Active Sprint: ${sprint.name} (${sprint.id})`);
    console.log(`Found ${sprint.items.length} items`);

    sprint.items.forEach((i) => {
      const b = i.backlogItem;
      console.log('------------------------------------------------');
      console.log(`Item: ${b.title} (${b.type})`);
      console.log(`  > ID: ${b.id}`);
      console.log(
        `  > Contractor: ${b.contractor ? b.contractor.name : 'NONE'} (ID: ${b.contractorId})`,
      );

      if (b.parent) {
        console.log(`  > Parent: ${b.parent.title}`);
        console.log(
          `  > Parent Contractor: ${b.parent.contractor ? b.parent.contractor.name : 'NONE'} (ID: ${b.parent.contractorId})`,
        );
      } else {
        console.log(`  > Parent: NONE`);
      }
    });
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
