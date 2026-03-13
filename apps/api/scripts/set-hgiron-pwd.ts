import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'hgiron@gruposmartbusiness.com';
  const password = 'FieldClose2026!'; // The password to assign

  console.log(`Buscando usuario en base de datos: ${email}`);
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error('ERROR: Usuario no encontrado:', email);
    const allUsers = await prisma.user.findMany({ select: { email: true } });
    console.log('Usuarios disponibles en la base de datos de staging:');
    allUsers.forEach((u) => console.log(`- ${u.email}`));
    return;
  }

  console.log('Usuario encontrado. Hasheando contraseña...');
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
      status: 'ACTIVE',
      invitationToken: null,
      invitationExpires: null,
    },
  });

  console.log('✅ CONTRASEÑA ACTUALIZADA CON ÉXITO');
  console.log(`Usuario: ${email}`);
  console.log(`Nueva contraseña: ${password}`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
