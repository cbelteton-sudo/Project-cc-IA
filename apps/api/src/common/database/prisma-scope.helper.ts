import { AccessScope } from '../auth/permissions.matrix';

export interface UserContext {
  id: string;
  tenantId: string;
  role?: string;
  scope?: AccessScope;
  assignedProjectIds?: string[];
}

/**
 * Fuerza el contexto de Tenant y/o Project en el WHERE clause de Prisma
 * Previene el Bypass de SQL (Multi-Tenant / Scoped leaks)
 */
export function enforceScopeWhere<T extends object>(
  currentUser: UserContext,
  extraWhere: T = {} as T,
  projectId?: string,
): T & { tenantId: string; projectId?: string; OR?: any[] } {
  if (!currentUser || !currentUser.tenantId) {
    throw new Error(
      'SISTEMA CRÍTICO: Contexto de usuario no definido para query!',
    );
  }

  // Sanitización de llaves sensibles en extraWhere (Anti-Bypass)
  const sanitizedExtraWhere = { ...extraWhere } as Record<string, any>;
  const sensitiveKeys = ['tenantId', 'projectId', 'portfolioId', 'userId'];
  for (const key of sensitiveKeys) {
    if (key in sanitizedExtraWhere) {
      console.warn(
        `[SECURITY WARNING] Intento de inyección de llave sensible '${key}' detectado en extraWhere por el usuario ${currentUser.id} (tenant: ${currentUser.tenantId})`,
      );
      delete sanitizedExtraWhere[key];
    }
  }

  // Prevalece el estado autorizado del servidor, sin importar el input
  const baseWhere: any = {
    ...sanitizedExtraWhere,
    tenantId: currentUser.tenantId,
  };

  // Si requiere filtro explícito en base al Endpoint
  if (projectId) {
    baseWhere.projectId = projectId;
  }

  // Protección preventiva
  if (!projectId) {
    const scope = currentUser.scope || AccessScope.ASSIGNED_PROJECTS;

    if (
      scope === AccessScope.ASSIGNED_PROJECTS &&
      currentUser.assignedProjectIds
    ) {
      baseWhere.projectId = { in: currentUser.assignedProjectIds };
    }
  }

  return baseWhere;
}
