import { PrismaClient } from '@prisma/client';
import {
  ROLE_PERMISSIONS,
  Permission,
} from '../../src/common/constants/permissions';
import { ProjectRole } from '../../src/common/constants/roles';
import { roleHierarchy } from '../../src/common/auth/permissions.matrix';

const prisma = new PrismaClient();

async function main() {
  console.log(
    '🌱 Iniciando Seed de Sistema RBAC (SystemRole, SystemPermission)...',
  );

  // 1. Crear todos los Permisos existentes en el Enum `Permission`
  console.log('🔄 Sincronizando Permisos Base...');
  const allPermissions = Object.values(Permission);
  for (const perm of allPermissions) {
    await prisma.systemPermission.upsert({
      where: { action: perm as string },
      update: {},
      create: { action: perm as string, description: `Permiso para: ${perm}` },
    });
  }
  console.log(`✅ ${allPermissions.length} permisos sincronizados.`);

  // 2. Crear todos los Roles definidos en `ROLE_PERMISSIONS` (incluyendo jerarquías)
  console.log('🔄 Sincronizando Roles y Relaciones...');
  const rolesWithExplicitPerms = Object.keys(ROLE_PERMISSIONS) as ProjectRole[];

  for (const roleName of rolesWithExplicitPerms) {
    // 2.1 Asegurar que el rol existe
    const roleRecord = await prisma.systemRole.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, description: `Rol de Sistema: ${roleName}` },
    });

    // 2.2 Calcular permisos efectivos (Explicitos + Heredados)
    const basePerms = ROLE_PERMISSIONS[roleName] || [];
    const inheritedRoles = roleHierarchy[roleName] || [];
    const inheritedPerms = inheritedRoles.flatMap(
      (r: string) => ROLE_PERMISSIONS[r as ProjectRole] || [],
    );

    const effectivePermsSet = new Set([...basePerms, ...inheritedPerms]);
    const effectivePerms = Array.from(effectivePermsSet);

    // 2.3 Vincular permisos al rol en la base de datos
    let vinculados = 0;
    for (const permAction of effectivePerms) {
      const permissionRecord = await prisma.systemPermission.findUnique({
        where: { action: permAction as string },
      });

      if (permissionRecord) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: roleRecord.id,
              permissionId: permissionRecord.id,
            },
          },
          update: {},
          create: {
            roleId: roleRecord.id,
            permissionId: permissionRecord.id,
          },
        });
        vinculados++;
      }
    }
    console.log(
      `   🔸 Rol [${roleName}] => ${vinculados} permisos vinculados.`,
    );
  }

  console.log('✅ Seed de RBAC completado exquisitamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando el Seed RBAC:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
