import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: 'demo' } });
  if (!tenant) throw new Error('Tenant demo not found');

  const project = await prisma.project.findFirst({
    where: { tenantId: tenant.id, name: 'Torre Norte 2' },
  });
  if (!project) throw new Error('Project Torre Norte 2 not found');

  // Delete the global contractors I just created
  const namesToDelete = [
    'CONSTRUCTORA ALFA',
    'ELECTROMECÁNICA BETA',
    'ACABADOS GAMMA',
    'PROVEEDOR DELTA',
  ];

  await prisma.contractor.deleteMany({
    where: {
      tenantId: tenant.id,
      name: { in: namesToDelete },
    },
  });
  console.log(`Deleted global contractors: ${namesToDelete.join(', ')}`);

  // Create project-level contractors
  const projectContractors = [
    { name: 'Contratista Estructura (Torre Norte 2)', type: 'CONTRACTOR' },
    { name: 'Contratista Instalaciones (Torre Norte 2)', type: 'CONTRACTOR' },
    { name: 'Contratista Acabados (Torre Norte 2)', type: 'CONTRACTOR' },
  ];

  for (const c of projectContractors) {
    // Check if it already exists to be safe
    const existing = await prisma.contractor.findFirst({
      where: { name: c.name, projectId: project.id },
    });
    if (!existing) {
      const created = await prisma.contractor.create({
        data: {
          ...c,
          tenantId: tenant.id,
          projectId: project.id,
        },
      });
      // Need to assign them as well via ContractorProjectAssignment?
      // Only if the UI requires it, but usually if projectId is set, it implies assignment.
      // Let's create an assignment record just in case.
      await prisma.contractorProjectAssignment.create({
        data: {
          tenantId: tenant.id,
          contractorId: created.id,
          projectId: project.id,
          status: 'ACTIVE',
        },
      });
      console.log(`Created project-level contractor: ${c.name}`);
    } else {
      console.log(`Contractor already exists: ${c.name}`);
    }
  }

  console.log('✅ Project-level contractors restored!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
