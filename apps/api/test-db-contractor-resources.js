const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("Fetching Contractors matching 'Estructura'...");
  const contractors = await prisma.contractor.findMany({
    where: { name: { contains: 'Estructura' } },
    include: { resources: true },
  });

  console.log(JSON.stringify(contractors, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
