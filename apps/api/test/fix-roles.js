const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: ['director@demo.com', 'supervisor@demo.com', 'operador@demo.com'],
      },
    },
    include: { projectMemberships: true },
  });

  for (const u of users) {
    if (u.projectMemberships.length > 0) {
      console.log(`${u.email} -> Role in DB: ${u.projectMemberships[0].role}`);
    } else {
      console.log(`${u.email} -> NO MEMBERSHIP`);
    }
  }

  // Update roles globally to fix it
  for (const u of users) {
    if (u.projectMemberships.length > 0) {
      const pm = u.projectMemberships[0];
      let newRole = 'VIEWER';
      if (u.email === 'director@demo.com') newRole = 'DIRECTOR';
      if (u.email === 'supervisor@demo.com') newRole = 'PM';
      if (u.email === 'operador@demo.com') newRole = 'FIELD_OPERATOR';

      await prisma.projectMember.update({
        where: { id: pm.id },
        data: { role: newRole },
      });
      console.log(`Updated ${u.email} to ${newRole}`);
    }
  }
}

check().then(() => process.exit(0));
