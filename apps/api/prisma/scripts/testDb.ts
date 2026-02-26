import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const dayana = await prisma.user.findFirst({
    where: { email: { contains: 'dayana' } },
  });
  if (!dayana) throw new Error('Dayana not found');

  const contractor = await prisma.contractor.findFirst({
    where: { name: { contains: 'SmartBusiness' } },
  });

  console.log('Dayana ID:', dayana.id);
  console.log('Contractor ID:', contractor?.id);

  // simulate backend transaction directly
  const userId = dayana.id;
  const contractorId = contractor?.id;

  const res = await prisma.user.update({
    where: { id: userId },
    data: { contractorId: contractorId === '' ? null : contractorId },
  });
  console.log('Updated user:', res);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
