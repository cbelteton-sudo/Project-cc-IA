import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Demo Seeding...');

  // 1. Create Tenant
  const tenantName = 'Constructora Integra S.A.';
  const tenantSlug = 'constructora-integra';

  let tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        slug: tenantSlug,
      },
    });
    console.log(`✅ Tenant created: ${tenant.name}`);
  } else {
    console.log(`ℹ️ Tenant already exists: ${tenant.name}`);
  }

  // 2. Create Users
  const passwordHash = await bcrypt.hash('Demo2026!', 10);

  const usersData = [
    { email: 'maria@constructora.com', name: 'María González', role: 'ADMIN' }, // PO
    { email: 'carlos@constructora.com', name: 'Carlos Ruiz', role: 'PM' }, // Scrum Master
    { email: 'ana@constructora.com', name: 'Ana Torres', role: 'USER' }, // Engineer
    { email: 'pedro@constructora.com', name: 'Pedro Martínez', role: 'USER' }, // Resident
    { email: 'luis@constructora.com', name: 'Luis Hernández', role: 'USER' }, // Supervisor
  ];

  const users: Record<string, any> = {};

  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        password: passwordHash,
        role: u.role,
        tenantId: tenant.id,
      },
    });
    users[u.email] = user;
    console.log(`✅ User created/found: ${u.name}`);
  }

  // Priority Mapping (1=Critical, 2=High, 3=Medium, 4=Low)
  const PRIORITY = {
    CRITICAL: 1,
    HIGH: 2,
    MEDIUM: 3,
    LOW: 4,
  };

  // Helper to subtract days
  const daysAgo = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  };

  const daysFromNow = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  };

  // 3. Projects
  // --- PROJECT 1: TORRE RESIDENCIAL ---
  const project1 = await prisma.project.create({
    data: {
      name: 'Torre Residencial Lomas del Valle',
      code: 'TR-LOMAS',
      status: 'ACTIVE',
      tenantId: tenant.id,
      enableScrum: true,
      globalBudget: 18500000,
      currency: 'GTQ',
      startDate: daysAgo(60),
      endDate: daysFromNow(120),
      managerName: users['maria@constructora.com'].name,
    },
  });
  console.log(`✅ Project 1 created: ${project1.name}`);

  // Sprint 1 (Closed)
  const p1_s1 = await prisma.sprint.create({
    data: {
      projectId: project1.id,
      name: 'Sprint 1: Cimentación',
      startDate: daysAgo(45),
      endDate: daysAgo(31),
      status: 'CLOSED',
      goal: 'Completar cimentación profunda y zapatas',
      createdByUserId: users['carlos@constructora.com'].id,
    },
  });

  // Sprint 1 Items (All DONE)
  const p1_s1_items = [
    { title: 'Excavación de zanjas nivel -2', points: 8 },
    { title: 'Colado de zapatas aisladas', points: 13 },
    { title: 'Instalación de acero de refuerzo cimentación', points: 8 },
    { title: 'Prueba de compactación suelo', points: 3 },
    { title: 'Trazo y nivelación', points: 2 },
  ];

  for (const item of p1_s1_items) {
    const backlogItem = await prisma.backlogItem.create({
      data: {
        projectId: project1.id,
        title: item.title,
        type: 'STORY',
        status: 'COMPLETED',
        storyPoints: item.points,
        priority: PRIORITY.HIGH,
        assigneeUserId: users['pedro@constructora.com'].id,
      },
    });

    await prisma.sprintItem.create({
      data: {
        sprintId: p1_s1.id,
        backlogItemId: backlogItem.id,
        boardStatus: 'DONE',
      },
    });
  }

  // Sprint 2 (Closed)
  const p1_s2 = await prisma.sprint.create({
    data: {
      projectId: project1.id,
      name: 'Sprint 2: Estructura N1-3',
      startDate: daysAgo(30),
      endDate: daysAgo(16),
      status: 'CLOSED',
      goal: 'Levantar estructura de primeros niveles',
      createdByUserId: users['carlos@constructora.com'].id,
    },
  });
  // Sprint 2 Items (All DONE)
  const p1_s2_items = [
    { title: 'Armado de columnas nivel 1', points: 8 },
    { title: 'Colado de losa nivel 2', points: 13 },
    { title: 'Instalación de ductos MEP nivel 1', points: 5 },
    { title: 'Descimbrado nivel 1', points: 3 },
  ];
  for (const item of p1_s2_items) {
    const backlogItem = await prisma.backlogItem.create({
      data: {
        projectId: project1.id,
        title: item.title,
        type: 'STORY',
        status: 'COMPLETED',
        storyPoints: item.points,
        priority: PRIORITY.HIGH,
        assigneeUserId: users['ana@constructora.com'].id,
      },
    });
    await prisma.sprintItem.create({
      data: {
        sprintId: p1_s2.id,
        backlogItemId: backlogItem.id,
        boardStatus: 'DONE',
      },
    });
  }

  // Sprint 3 (Active)
  const p1_s3 = await prisma.sprint.create({
    data: {
      projectId: project1.id,
      name: 'Sprint 3: Estructura N4-6',
      startDate: daysAgo(5),
      endDate: daysFromNow(9),
      status: 'ACTIVE',
      goal: 'Finalizar obra gris hasta nivel 6',
      createdByUserId: users['carlos@constructora.com'].id,
    },
  });

  // Sprint 3 Items (Mixed)
  const p1_s3_items = [
    {
      title: 'Cimbrado losa nivel 6',
      status: 'TODO',
      points: 8,
      user: 'pedro@constructora.com',
    },
    {
      title: 'Instalación escalera nivel 5-6',
      status: 'TODO',
      points: 5,
      user: 'luis@constructora.com',
    },
    {
      title: 'Impermeabilización nivel 4',
      status: 'TODO',
      points: 3,
      user: 'ana@constructora.com',
    },
    {
      title: 'Armado columnas nivel 5',
      status: 'IN_PROGRESS',
      points: 8,
      user: 'pedro@constructora.com',
    },
    {
      title: 'Colado muros nivel 4',
      status: 'IN_PROGRESS',
      points: 5,
      user: 'luis@constructora.com',
    },
    {
      title: 'Inspección soldadura nivel 4',
      status: 'REVIEW',
      points: 2,
      user: 'ana@constructora.com',
    },
    {
      title: 'Colado losa nivel 4',
      status: 'DONE',
      points: 13,
      user: 'pedro@constructora.com',
    },
    {
      title: 'Descimbrado nivel 3',
      status: 'DONE',
      points: 3,
      user: 'luis@constructora.com',
    },
  ];

  for (const item of p1_s3_items) {
    let boardStatus = item.status;
    if (item.status === 'REVIEW') boardStatus = 'IN_REVIEW';

    const backlogItem = await prisma.backlogItem.create({
      data: {
        projectId: project1.id,
        title: item.title,
        type: 'STORY',
        status: 'IN_SPRINT',
        storyPoints: item.points,
        priority: PRIORITY.MEDIUM,
        assigneeUserId: users[item.user].id,
      },
    });

    await prisma.sprintItem.create({
      data: {
        sprintId: p1_s3.id,
        backlogItemId: backlogItem.id,
        boardStatus: boardStatus,
      },
    });

    // Create Daily Update if Active/Done
    if (['IN_PROGRESS', 'DONE', 'REVIEW'].includes(item.status)) {
      await prisma.dailyUpdate.create({
        data: {
          projectId: project1.id,
          backlogItemId: backlogItem.id,
          sprintId: p1_s3.id,
          userId: users[item.user].id,
          text: `Avance en ${item.title}: ${item.status === 'DONE' ? 'Completado exitosamente.' : 'Trabajando según plan.'}`,
          createdAt: daysAgo(item.status === 'DONE' ? 2 : 0),
        },
      });
    }
  }

  // Daily Updates Specifics
  await prisma.dailyUpdate.create({
    data: {
      projectId: project1.id,
      sprintId: p1_s3.id,
      userId: users['ana@constructora.com'].id,
      text: 'Supervisé armado de columnas nivel 5. Avance al 60%. Mañana verifico alineación antes del colado. Blocker: Ninguno',
      createdAt: daysAgo(1),
    },
  });

  await prisma.dailyUpdate.create({
    data: {
      projectId: project1.id,
      sprintId: p1_s3.id,
      userId: users['pedro@constructora.com'].id,
      text: "Colado de muros nivel 4 completado. Se usaron 12m³ de concreto f'c=250.",
      createdAt: daysAgo(1),
    },
  });

  // Impediments Project 1
  await prisma.impediment.create({
    data: {
      projectId: project1.id,
      sprintId: p1_s3.id,
      title: 'Retraso Acero',
      description: 'Retraso entrega acero grado 60 - proveedor reporta 3 días',
      status: 'OPEN',
      severity: PRIORITY.HIGH,
      ownerUserId: users['carlos@constructora.com'].id,
      createdAt: daysAgo(2),
    },
  });

  await prisma.impediment.create({
    data: {
      projectId: project1.id,
      sprintId: p1_s3.id,
      title: 'Lluvia Colado',
      description: 'Lluvia detuvo colado losa nivel 4 por 2 días',
      status: 'RESOLVED',
      severity: PRIORITY.MEDIUM,
      ownerUserId: users['pedro@constructora.com'].id,
      createdAt: daysAgo(4),
      resolvedAt: daysAgo(1),
    },
  });

  // --- PROJECT 2: PLAZA FONTANA ---
  const project2 = await prisma.project.create({
    data: {
      name: 'Centro Comercial Plaza Fontana',
      code: 'CC-FONTANA',
      status: 'ACTIVE',
      tenantId: tenant.id,
      enableScrum: true,
      globalBudget: 32000000,
      currency: 'GTQ',
      startDate: daysAgo(40),
      endDate: daysFromNow(200),
      managerName: users['carlos@constructora.com'].name,
    },
  });
  console.log(`✅ Project 2 created: ${project2.name}`);

  // Sprint 1 (Closed)
  const p2_s1 = await prisma.sprint.create({
    data: {
      projectId: project2.id,
      name: 'Sprint 1: Obra Gris Sótano',
      startDate: daysAgo(30),
      endDate: daysAgo(9),
      status: 'CLOSED',
      goal: 'Terminar sótano y rampas',
      createdByUserId: users['maria@constructora.com'].id,
    },
  });

  // Items for P2 S1
  for (let i = 1; i <= 5; i++) {
    const bl = await prisma.backlogItem.create({
      data: {
        projectId: project2.id,
        title: `Tarea Sótano ${i}`,
        type: 'TASK',
        status: 'COMPLETED',
        storyPoints: 5,
        priority: PRIORITY.MEDIUM,
        assigneeUserId: users['luis@constructora.com'].id,
      },
    });
    await prisma.sprintItem.create({
      data: { sprintId: p2_s1.id, backlogItemId: bl.id, boardStatus: 'DONE' },
    });
  }

  // Sprint 2 (Active)
  const p2_s2 = await prisma.sprint.create({
    data: {
      projectId: project2.id,
      name: 'Sprint 2: Estructura Nivel 1',
      startDate: daysAgo(4),
      endDate: daysFromNow(10),
      status: 'ACTIVE',
      goal: 'Levantar locales ancla nivel 1',
      createdByUserId: users['maria@constructora.com'].id,
    },
  });

  // Impediments P2
  await prisma.impediment.create({
    data: {
      projectId: project2.id,
      sprintId: p2_s2.id,
      title: 'Planos MEP',
      description: 'Planos MEP desactualizados nivel 1',
      status: 'OPEN',
      severity: PRIORITY.CRITICAL,
      ownerUserId: users['ana@constructora.com'].id,
    },
  });

  // --- PROJECT 3: PUENTE MOTAGUA ---
  const project3 = await prisma.project.create({
    data: {
      name: 'Puente Vehicular Río Motagua',
      code: 'PUENTE-RIO',
      status: 'ACTIVE',
      tenantId: tenant.id,
      enableScrum: true,
      globalBudget: 8200000,
      currency: 'GTQ',
      startDate: daysAgo(10),
      endDate: daysFromNow(60),
      managerName: users['maria@constructora.com'].name,
    },
  });
  console.log(`✅ Project 3 created: ${project3.name}`);

  const p3_s1 = await prisma.sprint.create({
    data: {
      projectId: project3.id,
      name: 'Sprint 1: Pilas y Estribos',
      startDate: daysAgo(5),
      endDate: daysFromNow(9),
      status: 'ACTIVE',
      goal: 'Cimentación en lecho de río',
      createdByUserId: users['carlos@constructora.com'].id,
    },
  });

  // Items P3
  const p3_items = [
    { title: 'Excavación Pila 1', status: 'DONE', points: 8 },
    { title: 'Excavación Pila 2', status: 'IN_PROGRESS', points: 8 },
    { title: 'Colado Zapata Pila 1', status: 'TODO', points: 13 },
  ];

  for (const item of p3_items) {
    const bl = await prisma.backlogItem.create({
      data: {
        projectId: project3.id,
        title: item.title,
        type: 'STORY',
        status: 'IN_SPRINT',
        storyPoints: item.points,
        priority: PRIORITY.HIGH,
        assigneeUserId: users['pedro@constructora.com'].id,
      },
    });
    await prisma.sprintItem.create({
      data: {
        sprintId: p3_s1.id,
        backlogItemId: bl.id,
        boardStatus: item.status,
      },
    });
  }

  await prisma.impediment.create({
    data: {
      projectId: project3.id,
      sprintId: p3_s1.id,
      title: 'Nivel Freático',
      description: 'Nivel freático más alto de lo esperado en pila 3',
      status: 'OPEN',
      severity: PRIORITY.HIGH,
      ownerUserId: users['pedro@constructora.com'].id,
    },
  });

  console.log('🏁 Demo Seeding Completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
