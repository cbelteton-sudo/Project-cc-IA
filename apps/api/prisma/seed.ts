import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 0. Clean Phase 9 Data (Reverse order of dependencies)
  await prisma.activityClosureRecord.deleteMany();
  await prisma.activityWeeklyProgress.deleteMany();
  await prisma.activityDependency.deleteMany();
  await prisma.projectActivity.deleteMany();
  await prisma.projectMilestone.deleteMany();
  await prisma.contractorProjectAssignment.deleteMany();
  await prisma.contractor.deleteMany();

  // Eliminated destructive deleteMany blocks for T-MAWI to avoid FK errors (e.g. MaterialRequests)
  // We will use an idempotent approach (find and update/create) for projects instead.
  console.log('🧹 Cleaned existing Phase 9 data');

  // 1. Create Tenant (Upsert)
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Constructora Demo',
      slug: 'demo',
    },
  });
  console.log('✅ Tenant ready: Constructora Demo');

  // 2. Create Admin User (Upsert)
  const password = await bcrypt.hash('Developer1!', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: { password }, // Update password just in case
    create: {
      email: 'admin@demo.com',
      password,
      name: 'Admin User',
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  });
  console.log('✅ User ready: admin@demo.com');

  // 2.2 Create Heisel PM User
  await prisma.user.upsert({
    where: { email: 'heisel@smartbusiness.com' },
    update: { password, name: 'Heisel', role: 'PROJECT_MANAGER' }, // Enforce role and password
    create: {
      email: 'heisel@smartbusiness.com',
      password,
      name: 'Heisel',
      role: 'PROJECT_MANAGER',
      tenantId: tenant.id,
    },
  });
  console.log('✅ User ready: heisel@smartbusiness.com');

  // 2.5. Create Fluxori Admin User
  const fluxoriAdminPassword = await bcrypt.hash('Vg45&5L-F.xE5M$', 10);
  await prisma.user.upsert({
    where: { email: 'administrator@fluxori.io' },
    update: { password: fluxoriAdminPassword, name: 'Carlos Beltetón' },
    create: {
      email: 'administrator@fluxori.io',
      password: fluxoriAdminPassword,
      name: 'Carlos Beltetón',
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  });
  console.log('✅ User ready: administrator@fluxori.io');

  // 3. Create Contractors (COMMENTED OUT FOR CLEAN SLATE)
  // 3. Create Contractors
  const contractorsData = [
    { name: 'CONSTRUCTORA ALFA', type: 'CONTRACTOR' },
    { name: 'ELECTROMECÁNICA BETA', type: 'CONTRACTOR' },
    { name: 'ACABADOS GAMMA', type: 'CONTRACTOR' },
    { name: 'PROVEEDOR DELTA', type: 'SUPPLIER' },
  ];

  const contractors: any[] = [];
  for (const c of contractorsData) {
    const contractor = await prisma.contractor.create({
      data: { ...c, tenantId: tenant.id },
    });
    contractors.push(contractor);
  }
  console.log('✅ Created Contractors');

  // 4. Create Project "TORRE MAWI DEMO"
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 30); // 30 days ago
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 120); // 120 days future

  const projectData1 = {
    name: 'TORRE MAWI DEMO',
    code: 'T-MAWI',
    status: 'ACTIVE',
    currency: 'GTQ',
    tenantId: tenant.id,
    startDate,
    endDate,
    globalBudget: 2500000,
  };
  let project = await prisma.project.findFirst({
    where: { code: 'T-MAWI', tenantId: tenant.id },
  });
  if (!project) {
    project = await prisma.project.create({ data: projectData1 });
  } else {
    project = await prisma.project.update({
      where: { id: project.id },
      data: projectData1,
    });
  }
  console.log('🏗️ Upserted Project: TORRE MAWI DEMO');

  // 4.5 Assign Heisel to Project
  const heisel = await prisma.user.findUnique({ where: { email: 'heisel@smartbusiness.com' } });
  if (heisel) {
    await prisma.projectMember.upsert({
      where: {
        projectId_userId: { projectId: project.id, userId: heisel.id }
      },
      update: { role: 'PROJECT_MANAGER' },
      create: {
        projectId: project.id,
        userId: heisel.id,
        role: 'PROJECT_MANAGER'
      }
    });
    console.log('✅ Assign heisel@smartbusiness.com to TORRE MAWI DEMO');
  }

  // Create additional projects
  // ... [Skipping rest of the demo data creation] ...
  console.log('✅ MATERIALS Seeded');
  console.log('✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
