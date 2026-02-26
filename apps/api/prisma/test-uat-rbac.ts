import { PrismaClient } from '@prisma/client';
import { enforceScopeWhere } from '../src/common/database/prisma-scope.helper';
import { AccessScope } from '../src/common/auth/permissions.matrix';

const prisma = new PrismaClient();

async function runTests() {
  console.log('--- STARTING UAT RBAC QUICK TESTS ---');

  const tenantSlug = 'uat-corp';
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
  });
  if (!tenant) throw new Error('Tenant not found');

  const usersToTest = ['pm_1', 'pm_2', 'residente_1', 'platform_admin_1'];

  for (const usernamePrefix of usersToTest) {
    const email = `${usernamePrefix}@uatcorp.com`;
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        projectMemberships: {
          include: { project: true },
        },
      },
    });

    if (!user) {
      console.log(`❌ User ${email} not found`);
      continue;
    }

    const assignedProjectIds = user.projectMemberships.map((m) => m.projectId);

    let scope = AccessScope.ASSIGNED_PROJECTS;
    if (user.role === 'PLATFORM_ADMIN') scope = AccessScope.TENANT_WIDE;
    if (user.role === 'DIRECTOR_PMO') scope = AccessScope.PORTFOLIO_PROJECTS;

    const userContext = {
      id: user.id,
      tenantId: user.tenantId,
      role: user.role,
      scope,
      assignedProjectIds,
    };

    const queryWhere = enforceScopeWhere(userContext, {});
    // Adapt for querying Project model itself (it has `id`, not `projectId`)
    if (queryWhere.projectId !== undefined) {
      (queryWhere as any).id = queryWhere.projectId;
      delete (queryWhere as any).projectId;
    }
    const visibleProjects = await prisma.project.findMany({
      where: queryWhere as any,
    });

    console.log(`\n🔍 User: ${user.name} (${user.role})`);
    console.log(`   Scope: ${scope}`);
    console.log(
      `   Explicitly Assigned Projects: ${user.projectMemberships.length > 0 ? user.projectMemberships.map((m) => m.project.name).join(', ') : 'None'}`,
    );
    console.log(
      `   Projects Queryable via enforceScopeWhere: ${visibleProjects.length}`,
    );
    visibleProjects.forEach((p) => console.log(`      - ${p.name}`));
  }

  console.log('\n--- UAT RBAC QUICK TESTS COMPLETED ---');
}

runTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
