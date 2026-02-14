import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Scrum Seed...');

  // 1. Get Tenant (Created by main seed)
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'demo' },
  });

  if (!tenant) {
    console.error('❌ Tenant "demo" not found. Run main seed first.');
    return;
  }

  // 2. Get Admin User
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@demo.com' },
  });

  if (!admin) {
    console.error('❌ User "admin@demo.com" not found. Run main seed first.');
    return;
  }

  // 3. Create Scrum Project
  console.log('🏗️ Creating Scrum Project...');
  const project = await prisma.project.create({
    data: {
      name: 'TORRE MAWI AGILE',
      code: 'AGILE-01',
      status: 'ACTIVE',
      currency: 'GTQ',
      tenantId: tenant.id,
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      managerName: 'Admin User',
      enableScrum: true, // Enable Scrum Module
    },
  });

  // 4. Create Sprints
  console.log('🏃 Creating Sprints...');
  const now = new Date();

  // Past Sprint (Closed)
  const sprint1Start = new Date(now);
  sprint1Start.setDate(now.getDate() - 14);
  const sprint1End = new Date(now);
  sprint1End.setDate(now.getDate() - 1);

  const sprint1 = await prisma.sprint.create({
    data: {
      projectId: project.id, // Removed tenantId
      name: 'Sprint 1: Cimentación',
      goal: 'Completar cimentación profunda',
      startDate: sprint1Start,
      endDate: sprint1End,
      status: 'CLOSED',
      createdByUserId: admin.id, // Added required field
      // Removed number, velocity, actualPoints (not in schema)
    },
  });

  // Active Sprint
  const sprint2Start = new Date(now);
  const sprint2End = new Date(now);
  sprint2End.setDate(now.getDate() + 13);

  const sprint2 = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: 'Sprint 2: Levantado Muros',
      goal: 'Iniciar levantado de muros nivel 1',
      startDate: sprint2Start,
      endDate: sprint2End,
      status: 'ACTIVE',
      createdByUserId: admin.id,
    },
  });

  // Future Sprint
  const sprint3Start = new Date(sprint2End);
  sprint3Start.setDate(sprint3Start.getDate() + 1);
  const sprint3End = new Date(sprint3Start);
  sprint3End.setDate(sprint3Start.getDate() + 14);

  const sprint3 = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: 'Sprint 3: Instalaciones',
      goal: 'Instalaciones hidráulicas y sanitarias',
      startDate: sprint3Start,
      endDate: sprint3End,
      status: 'PLANNED',
      createdByUserId: admin.id,
    },
  });

  // 5. Create Backlog Items & Assign to Sprints
  console.log('📝 Creating Backlog Items...');

  // Helper function
  const createItem = async (
    title: string,
    type: string,
    status: string,
    priority: number,
    sprintId: string | null = null,
    parentId: string | null = null,
    storyPoints: number | null = null,
    boardStatus: string = 'TODO',
  ) => {
    // 1. Create Backlog Item
    const item = await prisma.backlogItem.create({
      data: {
        projectId: project.id, // Removed tenantId
        title,
        type, // STORY, TASK, BUG, EPIC
        status, // BACKLOG, SPRINT_READY, IN_PROGRESS, DONE
        priority,
        parentId,
        storyPoints,
        assigneeUserId: admin.id,
      },
    });

    // 2. Link to Sprint if sprintId is provided
    if (sprintId) {
      await prisma.sprintItem.create({
        data: {
          sprintId: sprintId,
          backlogItemId: item.id,
          boardStatus: boardStatus,
        },
      });
    }

    return item;
  };

  // --- SPRINT 1 ITEMS (CLOSED) ---
  const story1 = await createItem(
    'Excavación Masiva',
    'STORY',
    'DONE',
    5,
    sprint1.id,
    null,
    8,
    'DONE',
  );
  await createItem(
    'Movimiento de Tierras',
    'TASK',
    'DONE',
    3,
    sprint1.id,
    story1.id,
    null,
    'DONE',
  );
  await createItem(
    'Retiro de ripio',
    'TASK',
    'DONE',
    2,
    sprint1.id,
    story1.id,
    null,
    'DONE',
  );

  const story2 = await createItem(
    'Zapatas',
    'STORY',
    'DONE',
    5,
    sprint1.id,
    null,
    13,
    'DONE',
  );
  await createItem(
    'Armado de hierro',
    'TASK',
    'DONE',
    3,
    sprint1.id,
    story2.id,
    null,
    'DONE',
  );
  await createItem(
    'Fundición',
    'TASK',
    'DONE',
    3,
    sprint1.id,
    story2.id,
    null,
    'DONE',
  );

  // --- SPRINT 2 ITEMS (ACTIVE) ---
  const story3 = await createItem(
    'Muros Nivel 1',
    'STORY',
    'IN_PROGRESS',
    5,
    sprint2.id,
    null,
    13,
    'IN_PROGRESS',
  );
  await createItem(
    'Pegado de block Ejes A-C',
    'TASK',
    'DONE',
    3,
    sprint2.id,
    story3.id,
    null,
    'DONE',
  );
  await createItem(
    'Pegado de block Ejes D-F',
    'TASK',
    'IN_PROGRESS',
    3,
    sprint2.id,
    story3.id,
    null,
    'IN_PROGRESS',
  );
  await createItem(
    'Soleras intermedias',
    'TASK',
    'TODO',
    3,
    sprint2.id,
    story3.id,
    null,
    'TODO',
  );

  const story4 = await createItem(
    'Columnas Nivel 1',
    'STORY',
    'TODO',
    4,
    sprint2.id,
    null,
    8,
    'TODO',
  );
  await createItem(
    'Encofrado',
    'TASK',
    'TODO',
    2,
    sprint2.id,
    story4.id,
    null,
    'TODO',
  );
  await createItem(
    'Fundición',
    'TASK',
    'TODO',
    2,
    sprint2.id,
    story4.id,
    null,
    'TODO',
  );

  // Bug in Sprint 2
  await createItem(
    'Fuga de agua en toma provisional',
    'BUG',
    'IN_PROGRESS',
    5,
    sprint2.id,
    null,
    null,
    'IN_REVIEW',
  );

  // --- SPRINT 3 ITEMS (PLANNED) ---
  await createItem(
    'Ductería Eléctrica Losa 1',
    'STORY',
    'SPRINT_READY',
    4,
    sprint3.id,
    null,
    5,
  );
  await createItem(
    'Tubería Drenaje N1',
    'STORY',
    'SPRINT_READY',
    3,
    sprint3.id,
    null,
    3,
  );

  // --- BACKLOG (NO SPRINT) ---
  const epic1 = await createItem('Acabados Finales', 'EPIC', 'BACKLOG', 3);
  await createItem(
    'Piso Cerámico N1',
    'STORY',
    'BACKLOG',
    3,
    null,
    epic1.id,
    8,
  );
  await createItem('Pintura General', 'STORY', 'BACKLOG', 2, null, epic1.id, 5);
  await createItem('Ventanas', 'STORY', 'BACKLOG', 2, null, null, 3);
  await createItem('Puertas', 'STORY', 'BACKLOG', 1, null, null, 2);

  console.log('✅ Scrum Seed Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
