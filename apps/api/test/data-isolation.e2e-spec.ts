import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Data Isolation & RBAC (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let tenantA: any, tenantB: any;
  let pmA: any, pmB: any, directorA: any, contractorUserA: any;
  let projectA1: any, projectA2: any, projectB1: any;
  const tokens: Record<string, string> = {};

  const testSessionId = Date.now().toString().slice(-6);

  beforeAll(async () => {
    // 1. Initialize realistic nest application without mocking critical logic
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    // 2. Clear previous potentially conflicting data for safety
    // Usually handled by generated random IDs, but good practice.

    // 3. Setup Data Fixtures
    // Tenants
    tenantA = await prisma.tenant.create({
      data: {
        name: `Tenant A ${testSessionId}`,
        slug: `tenant-a-${testSessionId}`,
      },
    });
    tenantB = await prisma.tenant.create({
      data: {
        name: `Tenant B ${testSessionId}`,
        slug: `tenant-b-${testSessionId}`,
      },
    });

    // Projects
    projectA1 = await prisma.project.create({
      data: {
        name: `Proj A1 ${testSessionId}`,
        tenantId: tenantA.id,
        status: 'ACTIVE',
      },
    });
    projectA2 = await prisma.project.create({
      data: {
        name: `Proj A2 ${testSessionId}`,
        tenantId: tenantA.id,
        status: 'ACTIVE',
      },
    });
    projectB1 = await prisma.project.create({
      data: {
        name: `Proj B1 ${testSessionId}`,
        tenantId: tenantB.id,
        status: 'ACTIVE',
      },
    });

    // Users
    pmA = await prisma.user.create({
      data: {
        email: `pma_${testSessionId}@test.com`,
        tenantId: tenantA.id,
        role: 'USER',
      },
    });
    pmB = await prisma.user.create({
      data: {
        email: `pmb_${testSessionId}@test.com`,
        tenantId: tenantB.id,
        role: 'USER',
      },
    });
    directorA = await prisma.user.create({
      data: {
        email: `dira_${testSessionId}@test.com`,
        tenantId: tenantA.id,
        role: 'DIRECTOR_PMO',
      },
    });
    contractorUserA = await prisma.user.create({
      data: {
        email: `cona_${testSessionId}@test.com`,
        tenantId: tenantA.id,
        role: 'USER',
      },
    });

    // Memberships
    await prisma.projectMember.create({
      data: {
        projectId: projectA1.id,
        userId: pmA.id,
        role: 'PROJECT_MANAGER',
        status: 'ACTIVE',
      },
    });
    await prisma.projectMember.create({
      data: {
        projectId: projectA2.id,
        userId: pmA.id,
        role: 'PROJECT_MANAGER',
        status: 'ACTIVE',
      },
    });
    await prisma.projectMember.create({
      data: {
        projectId: projectB1.id,
        userId: pmB.id,
        role: 'PROJECT_MANAGER',
        status: 'ACTIVE',
      },
    });

    // Director A in Project A1 just to test direct endpoints.
    await prisma.projectMember.create({
      data: {
        projectId: projectA1.id,
        userId: directorA.id,
        role: 'DIRECTOR_PMO',
        status: 'ACTIVE',
      },
    });

    await prisma.projectMember.create({
      data: {
        projectId: projectA1.id,
        userId: contractorUserA.id,
        role: 'CONTRACTOR_LEAD',
        status: 'ACTIVE',
      },
    });

    // Tokens
    const signPayload = (user: any) =>
      jwtService.sign({
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
      });
    tokens.pmA = signPayload(pmA);
    tokens.pmB = signPayload(pmB);
    tokens.directorA = signPayload(directorA);
    tokens.contractorA = signPayload(contractorUserA);
  }, 30000);

  afterAll(async () => {
    // Cleanup fixtures
    await prisma.projectMember.deleteMany({
      where: {
        userId: { in: [pmA.id, pmB.id, directorA.id, contractorUserA.id] },
      },
    });
    await prisma.project.deleteMany({
      where: { id: { in: [projectA1.id, projectA2.id, projectB1.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [pmA.id, pmB.id, directorA.id, contractorUserA.id] } },
    });
    await prisma.tenant.deleteMany({
      where: { id: { in: [tenantA.id, tenantB.id] } },
    });
    await app.close();
  });

  describe('1. Aislamiento entre tenants', () => {
    it('Caso A: Usuario tenant A intenta leer recurso tenant B (vía request directas a endpoints list)', async () => {
      // pmA should only see projA1 and projA2, NEVER projB1
      const res = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${tokens.pmA}`)
        .expect(200);

      const projectIds = res.body.map((p: any) => p.id);
      expect(projectIds).toContain(projectA1.id);
      expect(projectIds).toContain(projectA2.id);
      expect(projectIds).not.toContain(projectB1.id);
    });

    it('Caso B: Usuario tenant A intenta leer proyecto B1 directo', async () => {
      await request(app.getHttpServer())
        .get(`/projects/${projectB1.id}`)
        .set('Authorization', `Bearer ${tokens.pmA}`)
        .expect(403);
      // 403 Forbidden is expected because they don't have membership
    });
  });

  describe('2. Aislamiento entre proyectos', () => {
    it('Caso A: PM_B asignado a B1 intenta acceder a A1', async () => {
      await request(app.getHttpServer())
        .get(`/projects/${projectA1.id}/dashboard-overview`)
        .set('Authorization', `Bearer ${tokens.pmB}`)
        .expect(403);
    });

    it('Caso C: Contratista entra a su proyecto asignado A1 pero no puede al A2', async () => {
      await request(app.getHttpServer())
        .get(`/projects/${projectA1.id}`)
        .set('Authorization', `Bearer ${tokens.contractorA}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/projects/${projectA2.id}`)
        .set('Authorization', `Bearer ${tokens.contractorA}`)
        .expect(403);
    });
  });

  describe('3. Alcance de portfolio (DIRECTOR_PMO)', () => {
    it('Director ve proyectos de su tenant', async () => {
      const res = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${tokens.directorA}`)
        .expect(200);

      const projectIds = res.body.map((p: any) => p.id);
      // Director automatically sees A1 and A2 through `enforceScopeWhere` if endpoints use it correctly.
      expect(projectIds).toContain(projectA1.id);
      expect(projectIds).toContain(projectA2.id);
      expect(projectIds).not.toContain(projectB1.id);
    });
  });

  describe('4. Anti-Bypass de scope (inyección maliciosa)', () => {
    it('Filtros seguros prevalecen contra ataques en payload', async () => {
      // Creating an activity with malicious tenantId
      const maliciousPayload = {
        name: 'Malicious Activity',
        projectId: projectA1.id,
        startDate: '2023-01-01T00:00:00.000Z',
        endDate: '2023-01-31T00:00:00.000Z',
        tenantId: tenantB.id, // Attempting to inject into tenantB
      };

      const res = await request(app.getHttpServer())
        .post(`/activities`)
        .set('Authorization', `Bearer ${tokens.pmA}`)
        .send(maliciousPayload)
        .expect(201);

      expect(res.body.tenantId).not.toEqual(tenantB.id);
      expect(res.body.tenantId).toEqual(tenantA.id);

      // Cleanup
      await prisma.projectActivity.delete({ where: { id: res.body.id } });
    });
  });
});
