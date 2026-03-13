import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const contractors = await prisma.contractor.findMany({
    include: { resources: true },
  });
  const users = await prisma.user.findMany({
    where: { contractorId: { not: null } },
  });

  console.log(
    'Contractors:',
    contractors.map((c) => c.name),
  );
  for (const c of contractors) {
    console.log(`Resources for ${c.name}:`, c.resources.length);
  }
  console.log(
    'Users with contractorId:',
    users.map((u) => ({ email: u.email, id: u.contractorId })),
  );
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
