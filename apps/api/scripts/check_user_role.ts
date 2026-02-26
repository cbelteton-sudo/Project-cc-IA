import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  const email = 'belteton.carlos@hotmail.com';
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log(`User ${email} not found.`);
    // Try Maria as fallback to compare
    const maria = await prisma.user.findUnique({
      where: { email: 'maria@constructora.com' },
    });
    console.log('Maria:', maria);
  } else {
    console.log('User found:', user);
  }
}

checkUser()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
