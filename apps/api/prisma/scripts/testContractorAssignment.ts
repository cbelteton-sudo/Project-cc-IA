import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const projectId = 'b7371d3d-f215-4ece-8cfa-c419996b27bb'; // Just guessing or finding the project ID
  
  const assignments = await prisma.contractorProjectAssignment.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { contractor: true, project: true }
  });
  
  console.log("Last 5 assignments:");
  console.dir(assignments, { depth: null });
  
  const contractors = await prisma.contractor.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  
  console.log("\nLast 5 contractors:");
  console.dir(contractors, { depth: null });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
