import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Permission, ROLE_PERMISSIONS } from '../../constants/permissions';
import { ProjectRole } from '../../constants/roles';
import { roleHierarchy } from '../permissions.matrix';

@Injectable()
export class PermissionRepository implements OnModuleInit {
  private readonly logger = new Logger(PermissionRepository.name);
  private RBAC_DB_ONLY: boolean = false;

  constructor(private readonly prisma: PrismaService) {
    this.RBAC_DB_ONLY = process.env.RBAC_DB_ONLY === 'true';
  }

  async onModuleInit() {
    this.logger.log(
      `⚙️ Configurando Feature Flag RBAC_DB_ONLY: ${this.RBAC_DB_ONLY}`,
    );

    // Fail-Fast: Si el flag está activo, la BDD de Seguridad NO puede estar vacía.
    if (this.RBAC_DB_ONLY) {
      const rolesCount = await this.prisma.systemRole.count();
      if (rolesCount === 0) {
        this.logger.error(
          'CRITICAL ERROR: RBAC_DB_ONLY está activo pero la tabla SystemRole está vacía. Abortando arranque...',
        );
        throw new Error(
          'Base de datos de Seguridad vacía con Feature Flag RBAC_DB_ONLY activado.',
        );
      }
      this.logger.log(
        '✅ Base de datos de Seguridad validada con éxito. Usando Roles de DB.',
      );
    } else {
      this.logger.warn(
        '⚠️ Usando Matriz Hardcoded (Legacy) para permisos. Considera migrar a Base de Datos.',
      );
    }
  }

  /**
   * Obtiene la estructura completa de Permisos Efectivos para un Rol dado en el Proyecto.
   * Si RBAC_DB_ONLY = true, lee de la Base de Datos.
   * Si RBAC_DB_ONLY = false, cae de regreso a las constantes Hardcodeadas (Plan de Rollback Local/Legacy).
   */
  async getEffectivePermissionsForRole(roleName: string): Promise<string[]> {
    if (this.RBAC_DB_ONLY) {
      return this._getPermissionsFromDB(roleName);
    } else {
      return this._getPermissionsFromLegacy(roleName as ProjectRole);
    }
  }

  private async _getPermissionsFromDB(roleName: string): Promise<string[]> {
    const roleRecord = await this.prisma.systemRole.findUnique({
      where: { name: roleName },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!roleRecord) {
      this.logger.warn(
        `Rol DB [${roleName}] no encontrado. Fallback a Array Vacio.`,
      );
      return [];
    }

    return roleRecord.permissions.map((rp) => rp.permission.action);
  }

  private _getPermissionsFromLegacy(roleName: ProjectRole): string[] {
    this.logger.warn(
      JSON.stringify({
        event: 'fallback_usage',
        reason: 'rbac_db_only_disabled',
        role: roleName,
        timestamp: new Date().toISOString(),
      }),
    );
    const basePerms = ROLE_PERMISSIONS[roleName] || [];
    const inheritedRoles = roleHierarchy[roleName] || [];

    // El sistema heredado original resolvía recursivamente. Como nuestro seed lo aplanó
    // replicamos la misma función vieja de AuthorizationService.getEffectivePermissions
    const inheritedPerms = inheritedRoles.flatMap((r) =>
      this._getPermissionsFromLegacy(r as ProjectRole),
    );

    const effectiveSet = new Set([...basePerms, ...inheritedPerms]);
    return Array.from(effectiveSet);
  }
}
