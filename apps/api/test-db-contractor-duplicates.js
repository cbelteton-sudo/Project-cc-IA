const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const contractors = await prisma.contractor.findMany({
    where: { name: { contains: 'Estructura' } },
    include: { resources: true },
  });
  console.log('Found Contractors:');
  contractors.forEach((c) =>
    console.log(
      `ID: ${c.id}, Name: ${c.name}, Resources: ${c.resources.length}`,
    ),
  );
}
run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
