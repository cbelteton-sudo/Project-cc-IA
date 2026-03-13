import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const projectId = 'd171b59f-f1a5-4681-9cfe-09c40550802b';

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error('Project not found');

  // get the admin user
  const adminUser = await prisma.user.findFirst({
    where: { email: 'administrator@fluxori.io' },
  });
  const assigneeId = adminUser ? adminUser.id : null;

  console.log('🌱 Restoring WBS and Backlog for ' + project.name);

  const wbsData = [
    {
      title: 'Obras Preliminares',
      isParent: true,
      children: [
        { title: 'Limpieza e instalación de campamento', days: 5 },
        { title: 'Trazo y nivelación topográfica', days: 3 },
      ],
    },
    {
      title: 'Cimentación',
      isParent: true,
      children: [
        { title: 'Excavación masiva', days: 10 },
        { title: 'Armado de acero para zapatas', days: 7 },
        { title: 'Fundición de zapatas y vigas conectivas', days: 4 },
      ],
    },
    {
      title: 'Estructura Torre',
      isParent: true,
      children: [
        { title: 'Armado columnas Nivel 1', days: 5 },
        { title: 'Fundición columnas Nivel 1', days: 2 },
        { title: 'Encofrado y armado losa Nivel 2', days: 8 },
        { title: 'Fundición losa Nivel 2', days: 2 },
      ],
    },
  ];

  let startDate = new Date('2026-03-01T10:00:00Z');

  for (let i = 0; i < wbsData.length; i++) {
    const parentBlock = wbsData[i];

    // Create parent ProjectActivity
    const parentActivity = await prisma.projectActivity.create({
      data: {
        project: { connect: { id: projectId } },
        tenant: { connect: { id: project.tenantId } },
        name: parentBlock.title,
        status: 'PENDING',
        startDate: startDate,
        endDate: new Date(startDate.getTime() + 15 * 24 * 60 * 60 * 1000), // approx
      },
    });

    let currentChildStart = new Date(startDate);

    for (const child of parentBlock.children) {
      const childEnd = new Date(
        currentChildStart.getTime() + child.days * 24 * 60 * 60 * 1000,
      );

      const childActivity = await prisma.projectActivity.create({
        data: {
          project: { connect: { id: projectId } },
          tenant: { connect: { id: project.tenantId } },
          name: child.title,
          status: 'PENDING',
          startDate: currentChildStart,
          endDate: childEnd,
          parent: { connect: { id: parentActivity.id } },
        },
      });

      // Create BacklogItem for Child
      await prisma.backlogItem.create({
        data: {
          project: { connect: { id: projectId } },
          title: child.title,
          type: 'TASK',
          status: 'TODO',
          priority: 2,
          storyPoints: child.days,
          linkedWbsActivity: { connect: { id: childActivity.id } },
          ...(assigneeId
            ? { assigneeUser: { connect: { id: assigneeId } } }
            : {}),
        },
      });

      currentChildStart = childEnd;
    }

    // Update startDate for next Parent block
    startDate = new Date(currentChildStart.getTime() + 2 * 24 * 60 * 60 * 1000);
  }

  console.log('✅ Tasks restored successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
