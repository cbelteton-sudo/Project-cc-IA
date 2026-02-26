import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING UAT RBAC DEMO SEED ---');
  const passwordHash = await bcrypt.hash('Developer1!', 10);

  // 1. Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'uat-corp' },
    update: {},
    create: {
      id: 'a0000000-0000-4000-a000-000000000000',
      name: 'UAT Corporation',
      slug: 'uat-corp',
    },
  });
  console.log(`✅ Tenant created: ${tenant.name}`);

  // 2. Contractors
  const contractorAlpha = await prisma.contractor.upsert({
    where: { id: 'c0000001-0000-4000-a000-000000000000' },
    update: {},
    create: {
      id: 'c0000001-0000-4000-a000-000000000000',
      tenantId: tenant.id,
      name: 'Constructora Alpha S.A.',
      type: 'CONTRACTOR',
      isActive: true,
    },
  });

  const contractorBeta = await prisma.contractor.upsert({
    where: { id: 'c0000002-0000-4000-a000-000000000000' },
    update: {},
    create: {
      id: 'c0000002-0000-4000-a000-000000000000',
      tenantId: tenant.id,
      name: 'Constructora Beta Ltda.',
      type: 'CONTRACTOR',
      isActive: true,
    },
  });
  console.log(`✅ Contractors created`);

  // 3. Projects
  const projectAlpha = await prisma.project.upsert({
    where: { id: 'p0000001-0000-4000-a000-000000000000' },
    update: {},
    create: {
      id: 'p0000001-0000-4000-a000-000000000000',
      tenantId: tenant.id,
      name: 'Proyecto Alpha (Portafolio Estratégico)',
      code: 'ALPHA-01',
      status: 'ACTIVE',
      currency: 'GTQ',
      enableScrum: true,
      enableBudget: true,
      enableFieldManagement: true,
    },
  });

  const projectBeta = await prisma.project.upsert({
    where: { id: 'p0000002-0000-4000-a000-000000000000' },
    update: {},
    create: {
      id: 'p0000002-0000-4000-a000-000000000000',
      tenantId: tenant.id,
      name: 'Proyecto Beta (Portafolio Estratégico)',
      code: 'BETA-02',
      status: 'ACTIVE',
      currency: 'GTQ',
      enableScrum: true,
      enableBudget: true,
      enableFieldManagement: true,
    },
  });

  const projectGamma = await prisma.project.upsert({
    where: { id: 'p0000003-0000-4000-a000-000000000000' },
    update: {},
    create: {
      id: 'p0000003-0000-4000-a000-000000000000',
      tenantId: tenant.id,
      name: 'Proyecto Gamma (Independiente)',
      code: 'GAMMA-03',
      status: 'ACTIVE',
      currency: 'GTQ',
      enableScrum: true,
      enableBudget: true,
      enableFieldManagement: true,
    },
  });
  console.log(`✅ Projects created`);

  // Contractor-Project Assignments
  await prisma.contractorProjectAssignment.upsert({
    where: {
      tenantId_contractorId_projectId: {
        tenantId: tenant.id,
        contractorId: contractorAlpha.id,
        projectId: projectAlpha.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      contractorId: contractorAlpha.id,
      projectId: projectAlpha.id,
      roleInProject: 'MAIN_CONTRACTOR',
      status: 'ACTIVE',
    },
  });

  await prisma.contractorProjectAssignment.upsert({
    where: {
      tenantId_contractorId_projectId: {
        tenantId: tenant.id,
        contractorId: contractorBeta.id,
        projectId: projectBeta.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      contractorId: contractorBeta.id,
      projectId: projectBeta.id,
      roleInProject: 'MAIN_CONTRACTOR',
      status: 'ACTIVE',
    },
  });

  // 4. Users Definition
  type UATUserDef = {
    email: string;
    name: string;
    role: string;
    projects: { project: any; projectRole: string }[];
    contractorId?: string;
  };

  const usersDef: UATUserDef[] = [
    // Global Roles
    {
      email: 'platform_admin_1@uatcorp.com',
      name: 'Platform Admin 1',
      role: 'PLATFORM_ADMIN',
      projects: [],
    },
    {
      email: 'platform_admin_2@uatcorp.com',
      name: 'Platform Admin 2',
      role: 'PLATFORM_ADMIN',
      projects: [],
    },
    {
      email: 'director_pmo_1@uatcorp.com',
      name: 'Director PMO 1',
      role: 'DIRECTOR_PMO',
      projects: [],
    },
    {
      email: 'director_pmo_2@uatcorp.com',
      name: 'Director PMO 2',
      role: 'DIRECTOR_PMO',
      projects: [],
    },

    // Project Managers
    {
      email: 'pm_1@uatcorp.com',
      name: 'Project Manager 1 (Alpha y Beta)',
      role: 'USER',
      projects: [
        { project: projectAlpha, projectRole: 'PROJECT_MANAGER' },
        { project: projectBeta, projectRole: 'PROJECT_MANAGER' },
      ],
    },
    {
      email: 'pm_2@uatcorp.com',
      name: 'Project Manager 2 (Gamma)',
      role: 'USER',
      projects: [{ project: projectGamma, projectRole: 'PROJECT_MANAGER' }],
    },

    // Alfa Team
    {
      email: 'supervisor_1@uatcorp.com',
      name: 'Supervisor Alpha',
      role: 'USER',
      projects: [{ project: projectAlpha, projectRole: 'SUPERVISOR' }],
    },
    {
      email: 'residente_1@uatcorp.com',
      name: 'Residente Alpha',
      role: 'USER',
      projects: [{ project: projectAlpha, projectRole: 'RESIDENTE' }],
    },
    {
      email: 'finanzas_1@uatcorp.com',
      name: 'Finanzas Alpha',
      role: 'USER',
      projects: [{ project: projectAlpha, projectRole: 'FINANZAS' }],
    },
    {
      email: 'client_viewer_1@uatcorp.com',
      name: 'Client Viewer Alpha',
      role: 'USER',
      projects: [{ project: projectAlpha, projectRole: 'CLIENT_VIEWER' }],
    },
    {
      email: 'contractor_lead_1@uatcorp.com',
      name: 'Contractor Lead Alpha',
      role: 'USER',
      contractorId: contractorAlpha.id,
      projects: [{ project: projectAlpha, projectRole: 'CONTRACTOR_LEAD' }],
    },

    // Beta Team
    {
      email: 'supervisor_2@uatcorp.com',
      name: 'Supervisor Beta',
      role: 'USER',
      projects: [{ project: projectBeta, projectRole: 'SUPERVISOR' }],
    },
    {
      email: 'residente_2@uatcorp.com',
      name: 'Residente Beta',
      role: 'USER',
      projects: [{ project: projectBeta, projectRole: 'RESIDENTE' }],
    },
    {
      email: 'finanzas_2@uatcorp.com',
      name: 'Finanzas Beta',
      role: 'USER',
      projects: [{ project: projectBeta, projectRole: 'FINANZAS' }],
    },
    {
      email: 'client_viewer_2@uatcorp.com',
      name: 'Client Viewer Beta',
      role: 'USER',
      projects: [{ project: projectBeta, projectRole: 'CLIENT_VIEWER' }],
    },
    {
      email: 'contractor_lead_2@uatcorp.com',
      name: 'Contractor Lead Beta',
      role: 'USER',
      contractorId: contractorBeta.id,
      projects: [{ project: projectBeta, projectRole: 'CONTRACTOR_LEAD' }],
    },
  ];

  for (const def of usersDef) {
    const user = await prisma.user.upsert({
      where: { email: def.email },
      update: {
        role: def.role,
        contractorId: def.contractorId || null,
      },
      create: {
        email: def.email,
        username: def.email.split('@')[0],
        name: def.name,
        password: passwordHash,
        role: def.role,
        status: 'ACTIVE',
        tenantId: tenant.id,
        contractorId: def.contractorId || undefined,
      },
    });

    for (const projDef of def.projects) {
      await prisma.projectMember.upsert({
        where: {
          projectId_userId: {
            projectId: projDef.project.id,
            userId: user.id,
          },
        },
        update: {
          role: projDef.projectRole,
          status: 'ACTIVE',
        },
        create: {
          projectId: projDef.project.id,
          userId: user.id,
          role: projDef.projectRole,
          status: 'ACTIVE',
          contractorId: def.contractorId || undefined,
        },
      });
    }
  }
  console.log(`✅ 16 UAT Users created & assigned`);

  // 5. Seed Minimal Data for Project Alpha to prevent empty screens
  const activitiesList = [
    {
      id: 'wk-a0000001-0000-4000-a000-000000000000',
      name: 'Trazo y Nivelación',
      status: 'DONE',
      days: -5,
    },
    {
      id: 'wk-a0000002-0000-4000-a000-000000000000',
      name: 'Excavaciones Fundaciones',
      status: 'IN_PROGRESS',
      days: 0,
    },
    {
      id: 'wk-a0000003-0000-4000-a000-000000000000',
      name: 'Armado de Zapatas',
      status: 'NOT_STARTED',
      days: 5,
    },
    {
      id: 'wk-a0000004-0000-4000-a000-000000000000',
      name: 'Fundición de Zapatas',
      status: 'BLOCKED',
      days: 10,
    },
    {
      id: 'wk-a0000005-0000-4000-a000-000000000000',
      name: 'Levantamiento de Muros',
      status: 'NOT_STARTED',
      days: 15,
    },
  ];

  for (const act of activitiesList) {
    await prisma.projectActivity.upsert({
      where: { id: act.id },
      update: {},
      create: {
        id: act.id,
        tenantId: tenant.id,
        projectId: projectAlpha.id,
        name: act.name,
        startDate: new Date(
          new Date().setDate(new Date().getDate() + act.days),
        ),
        endDate: new Date(
          new Date().setDate(new Date().getDate() + act.days + 5),
        ),
        status: act.status,
        contractorId: contractorAlpha.id,
      },
    });
  }

  const budgetAlpha = await prisma.budget.upsert({
    where: { id: 'bg-a0000001-0000-4000-a000-000000000000' },
    update: {},
    create: {
      id: 'bg-a0000001-0000-4000-a000-000000000000',
      projectId: projectAlpha.id,
      name: 'Presupuesto Base Alpha',
    },
  });

  const budgetLineAlpha = await prisma.budgetLine.upsert({
    where: { id: 'bl-a0000001-0000-4000-a000-000000000000' },
    update: {},
    create: {
      id: 'bl-a0000001-0000-4000-a000-000000000000',
      budgetId: budgetAlpha.id,
      costType: 'SUBCONTRACT',
      name: 'Cimentación Profunda',
      budgetBase: 150000,
    },
  });

  const subcontractAlpha = await prisma.subcontract.upsert({
    where: { id: 'sc-a0000001-0000-4000-a000-000000000000' },
    update: {},
    create: {
      id: 'sc-a0000001-0000-4000-a000-000000000000',
      projectId: projectAlpha.id,
      vendor: contractorAlpha.name,
      title: 'Subcontrato Cimentación',
      totalAmount: 125000,
      status: 'ACTIVE',
      startDate: new Date(),
    },
  });

  const sprintAlpha = await prisma.sprint.upsert({
    where: { id: 'sp-a0000001-0000-4000-a000-000000000000' },
    update: {},
    create: {
      id: 'sp-a0000001-0000-4000-a000-000000000000',
      projectId: projectAlpha.id,
      name: 'Sprint 1 - Arranque Alpha',
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
      status: 'ACTIVE',
      createdByUserId: (await prisma.user.findUnique({
        where: { email: 'pm_1@uatcorp.com' },
      }))!.id,
    },
  });

  const backlogItemAlpha = await prisma.backlogItem.upsert({
    where: { id: 'bi-a0000001-0000-4000-a000-000000000000' },
    update: {},
    create: {
      id: 'bi-a0000001-0000-4000-a000-000000000000',
      projectId: projectAlpha.id,
      type: 'TASK',
      title: 'Aprobar planos estructurales',
      status: 'IN_SPRINT',
      priority: 5,
    },
  });

  await prisma.sprintItem.upsert({
    where: {
      sprintId_backlogItemId: {
        sprintId: sprintAlpha.id,
        backlogItemId: backlogItemAlpha.id,
      },
    },
    update: {},
    create: {
      sprintId: sprintAlpha.id,
      backlogItemId: backlogItemAlpha.id,
      boardStatus: 'IN_PROGRESS',
    },
  });

  console.log(`✅ Demo Data seeded perfectly`);
  console.log('--- SEED COMPLETED ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
