const { PrismaClient } = require('./apps/api/node_modules/@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'administrator@fluxori.io' }, include: { projectMemberships: true } });
  console.log('User found:', !!user);
  if(user) {
     console.log('User role:', user.role);
     const isMatch = await bcrypt.compare('password', user.password || '');
     console.log('Password match:', isMatch);
  }
}
main().catch(console.error).finally(()=>prisma.$disconnect());
