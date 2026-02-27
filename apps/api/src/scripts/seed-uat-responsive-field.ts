import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectRole } from '../common/enums/project-role.enum';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  console.log('--- Starting UAT Field Command Center Seeding ---');

  // Hardcode passwords
  const passwordHash = await bcrypt.hash('CConstructions2026!', 10);

  // 1. Create Tenant (if missing)
  let tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Constructora Demo',
        slug: 'constructora-demo-uat',
      },
    });
    console.log(`Created Tenant: ${tenant.id}`);
  }

  // 2. Create Projects
  let uatProject = await prisma.project.findFirst({
    where: { code: 'FIELD_DEMO_UAT' },
  });

  if (!uatProject) {
    uatProject = await prisma.project.create({
      data: {
        name: 'FIELD_DEMO_UAT',
        code: 'FIELD_DEMO_UAT',
        status: 'ACTIVE',
        tenantId: tenant.id,
        description: 'Proyecto de Validación UAT Módulo de Campo',
      },
    });
  }
  console.log(`Verified Project: ${uatProject.name}`);

  // 3. Define UAT Users
  const uatUsers = [
    {
      email: 'operario_1@uat.com',
      name: 'Operario Uno',
      role: 'VIEWER',
      projectRole: ProjectRole.FIELD_OPERATOR,
    },
    {
      email: 'operario_2@uat.com',
      name: 'Operario Dos',
      role: 'VIEWER',
      projectRole: ProjectRole.FIELD_OPERATOR,
    },
    {
      email: 'residente_1@uat.com',
      name: 'Residente Uno',
      role: 'VIEWER',
      projectRole: ProjectRole.FIELD_OPERATOR,
    },
    {
      email: 'supervisor_1@uat.com',
      name: 'Supervisor Uno',
      role: 'VIEWER',
      projectRole: ProjectRole.PM,
    },
  ];

  // 4. Create Users and Assign to Project
  for (const u of uatUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
      },
      create: {
        email: u.email,
        name: u.name,
        password: passwordHash,
        role: u.role,
        tenantId: tenant.id,
        status: 'ACTIVE',
      },
    });

    // Assign project
    await prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: uatProject.id,
          userId: user.id,
        },
      },
      update: {
        role: u.projectRole,
      },
      create: {
        projectId: uatProject.id,
        userId: user.id,
        role: u.projectRole, // Assigned standard project role mapping
      },
    });
    console.log(
      `Created/Verified User: ${user.email} -> Role: ${u.projectRole}`,
    );
  }

  console.log('--- Seeding Complete ---');
  await app.close();
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
