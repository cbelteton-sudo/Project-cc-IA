const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

async function checkDb() {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true },
    });
    console.log('USERS IN DB:', users);

    // Test the endpoint with the first user's email if password is known,
    // or just let me know their emails.
  } catch (err) {
    console.error(err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDb();
