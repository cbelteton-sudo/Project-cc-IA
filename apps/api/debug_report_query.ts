import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const projectId = 'dce13f51-64c3-40b8-bfb8-1bdd1db8ab41'; // ID found in previous step

async function main() {
  console.log('Testing getSprintAssignments logic...');

  // 1. Fetch Active Sprint
  console.log('Step 1: Fetching sprint...');
  let sprint = await prisma.sprint.findFirst({
    where: { projectId, status: 'ACTIVE' },
    include: {
      items: {
        include: {
          backlogItem: {
            include: {
              assigneeUser: true,
              contractor: true,
            },
          },
        },
      },
    },
  });

  if (!sprint) {
    console.log('No active sprint found, fetching latest...');
    sprint = await prisma.sprint.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            backlogItem: {
              include: {
                assigneeUser: true,
                contractor: true,
              },
            },
          },
        },
      },
    });
  }

  if (!sprint) {
    console.log('No sprint found at all.');
    return;
  }

  console.log('Sprint found:', sprint.id, sprint.name);

  // 2. Map Assignments
  console.log('Step 2: Mapping assignments...');
  try {
    const assignments = sprint.items.map((item: any) => {
      const bi = item.backlogItem;
      // Simulate the logic in ReportsService
      return {
        id: bi.id,
        title: bi.title,
        status: item.boardStatus,
        type: bi.type,
        priority: bi.priority,
        assignee: bi.assigneeUser?.name || bi.contractor?.name || 'Sin Asignar',
        assigneeType: bi.assigneeUser
          ? 'USER'
          : bi.contractor
            ? 'CONTRACTOR'
            : 'NONE',
        startDate: sprint!.startDate,
        endDate: bi.dueDate || sprint!.endDate,
      };
    });
    console.log('Assignments mapped successfully. Count:', assignments.length);
    console.log(' Sample:', assignments[0]);
  } catch (error) {
    console.error('Error during mapping:', error);
  }
}

main()
  .catch((e) => {
    console.error('Script failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
