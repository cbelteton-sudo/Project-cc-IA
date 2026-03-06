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
        JSON.stringify({
          event: 'suspicious_extraWhere_keys',
          reason: 'attempted_override',
          userId: currentUser.id,
          tenantId: currentUser.tenantId,
          projectId,
          key,
          timestamp: new Date().toISOString(),
        }),
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

/**
 * Scope enforcement specifically for querying the Project model.
 * Uses `id` instead of `projectId` to match the schema.
 */
export function enforceProjectScopeWhere<T extends object>(
  currentUser: UserContext,
  extraWhere: T = {} as T,
  projectId?: string,
): T & { tenantId: string; id?: string | { in: string[] }; OR?: any[] } {
  if (!currentUser || !currentUser.tenantId) {
    throw new Error(
      'SISTEMA CRÍTICO: Contexto de usuario no definido para query!',
    );
  }

  const sanitizedExtraWhere = { ...extraWhere } as Record<string, any>;
  const sensitiveKeys = ['tenantId', 'id', 'portfolioId', 'userId'];
  for (const key of sensitiveKeys) {
    if (key in sanitizedExtraWhere) {
      delete sanitizedExtraWhere[key];
    }
  }

  const baseWhere: any = {
    ...sanitizedExtraWhere,
    tenantId: currentUser.tenantId,
  };

  if (projectId) {
    baseWhere.id = projectId;
  }

  if (!projectId) {
    const scope = currentUser.scope || AccessScope.ASSIGNED_PROJECTS;

    if (
      scope === AccessScope.ASSIGNED_PROJECTS &&
      currentUser.assignedProjectIds
    ) {
      baseWhere.id = { in: currentUser.assignedProjectIds };
    }
  }

  return baseWhere;
}
