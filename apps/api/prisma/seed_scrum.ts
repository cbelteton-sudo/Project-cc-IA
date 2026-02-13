import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Scrum Seeding...');

  // 1. Fetch Admin User (for createdByUserId)
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@demo.com' },
  });

  if (!adminUser) {
    console.error('❌ Admin user not found. Please run main seed first.');
    return;
  }

  // 2. Find or Create "Scrum Demo Project"
  let project = await prisma.project.findFirst({
    where: { name: 'Proyecto Ágil Demo' },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'Proyecto Ágil Demo',
        code: 'SCRUM-001',
        status: 'IN_PROGRESS',
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        globalBudget: 500000,
        tenantId: adminUser.tenantId, // Required
        enableScrum: true, // Ensure flag is on
      },
    });
    console.log('✅ Created Project: Proyecto Ágil Demo');
  } else {
    // Ensure Scrum is enabled
    await prisma.project.update({
      where: { id: project.id },
      data: { enableScrum: true },
    });
    console.log('ℹ️  Project "Proyecto Ágil Demo" found and updated.');
  }

  // 3. Get Contractors
  const contractor = await prisma.contractor.findFirst({
    where: { name: { contains: 'Alfa' } },
  });

  // 4. Create Sprints

  // 4.1 Closed Sprint (Past)
  const pastSprint = await prisma.sprint.create({
    data: {
      name: 'Sprint 1 (Fundayctions)',
      goal: 'Establecer bases del proyecto',
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
      endDate: new Date(new Date().setDate(new Date().getDate() - 16)),
      status: 'CLOSED',
      projectId: project.id,
      createdByUserId: adminUser.id,
    },
  });

  // 4.2 Active Sprint (Current)
  const activeSprint = await prisma.sprint.create({
    data: {
      name: 'Sprint 2 (Estructura)',
      goal: 'Levantamiento de muros y estructura principal',
      startDate: new Date(new Date().setDate(new Date().getDate() - 5)),
      endDate: new Date(new Date().setDate(new Date().getDate() + 9)),
      status: 'ACTIVE',
      projectId: project.id,
      createdByUserId: adminUser.id,
    },
  });

  // 4.3 Planned Sprint (Future)
  const plannedSprint = await prisma.sprint.create({
    data: {
      name: 'Sprint 3 (Acabados)',
      goal: 'Instalaciones y acabados finos',
      startDate: new Date(new Date().setDate(new Date().getDate() + 10)),
      endDate: new Date(new Date().setDate(new Date().getDate() + 24)),
      status: 'PLANNED',
      projectId: project.id,
      createdByUserId: adminUser.id,
    },
  });

  console.log('✅ Created 3 Sprints');

  // 5. Create Backlog Items

  // Helper to create item and link to sprint
  const createItem = async (
    title: string,
    type: string,
    status: string,
    priority: number,
    sprintId?: string,
    points?: number,
    hours?: number,
    parentId?: string,
    contractorId?: string,
  ) => {
    const item = await prisma.backlogItem.create({
      data: {
        title,
        type,
        status: 'BACKLOG', // BacklogItem status is always BACKLOG unless it's a child of a sprint item
        priority,
        storyPoints: points,
        estimatedHours: hours,
        projectId: project.id,
        parentId,
        contractorId,
        // If sprintId provided, create SprintItem relation
        sprintItems: sprintId
          ? {
              create: {
                sprintId,
                boardStatus:
                  status === 'DONE'
                    ? 'DONE'
                    : status === 'IN_PROGRESS'
                      ? 'IN_PROGRESS'
                      : 'TODO', // Map rudimentary status
              },
            }
          : undefined,
      },
    });
    return item;
  };

  // 5.1 Items for Closed Sprint (Done)
  await createItem(
    'Diseño Arquitectónico',
    'STORY',
    'DONE',
    5,
    pastSprint.id,
    8,
    undefined,
    undefined,
    contractor?.id,
  );
  await createItem(
    'Permisos de Construcción',
    'TASK',
    'DONE',
    5,
    pastSprint.id,
    undefined,
    40,
  );

  // 5.2 Items for Active Sprint
  const story1 = await createItem(
    'Levantamiento de Muros PB',
    'STORY',
    'IN_PROGRESS',
    4,
    activeSprint.id,
    13,
    undefined,
    undefined,
    contractor?.id,
  );

  // Tasks for Story 1
  await createItem(
    'Compra de Materiales',
    'TASK',
    'DONE',
    4,
    activeSprint.id,
    undefined,
    8,
    story1.id,
  );
  await createItem(
    'Pegado de Block',
    'TASK',
    'IN_PROGRESS',
    5,
    activeSprint.id,
    undefined,
    24,
    story1.id,
    contractor?.id,
  );

  // Standalone Bug
  await createItem(
    'Retraso en entrega de cemento',
    'BUG',
    'TODO',
    5,
    activeSprint.id,
  );

  // 5.3 Items for Planned Sprint
  await createItem(
    'Instalación Eléctrica',
    'STORY',
    'BACKLOG',
    3,
    plannedSprint.id,
    8,
  );
  await createItem(
    'Instalación Hidrosanitaria',
    'STORY',
    'BACKLOG',
    3,
    plannedSprint.id,
    8,
  );

  // 5.4 Backlog Items (No Sprint)
  await createItem('Jardinería y Exteriores', 'EPIC', 'BACKLOG', 2);
  await createItem('Pintura Final', 'STORY', 'BACKLOG', 2);

  console.log('✅ Created Backlog Items (linked to Sprints via SprintItems)');
  console.log('✨ Scrum Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
