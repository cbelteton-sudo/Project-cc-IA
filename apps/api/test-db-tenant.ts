import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const contractors = await prisma.contractor.findMany({ include: { resources: true } });
  
  for (const c of contractors) {
    console.log(`Contractor: ${c.name} (tenantId: ${c.tenantId})`);
    for (const r of c.resources) {
      console.log(`  - Resource: ${r.name} (tenantId: ${r.tenantId})`);
    }
  }
}

main().catch(console.error).finally(() => process.exit(0));
