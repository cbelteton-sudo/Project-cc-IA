import { Injectable } from '@nestjs/common';
import { roleHierarchy, AccessScope } from './permissions.matrix';
import { Permission, ROLE_PERMISSIONS } from '../constants/permissions';

export interface ResourceContext {
  tenantId: string;
  projectId?: string;
  portfolioId?: string;
  contractorId?: string;
}

@Injectable()
export class AuthorizationService {
  /**
   * Obtiene todos los permisos de un rol, incluyendo los heredados.
   */
  getEffectivePermissions(role: string): Permission[] {
    const basePerms =
      ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
    const inheritedRoles = roleHierarchy[role] || [];

    // Resolvemos recursivamente los permisos de los roles heredados
    const inheritedPerms = inheritedRoles.flatMap((r) =>
      this.getEffectivePermissions(r),
    );

    return Array.from(new Set([...basePerms, ...inheritedPerms]));
  }

  /**
   * Valida si un usuario tiene un permiso bajo un contexto específico (RBAC + Scope)
   */
  can(user: any, permission: Permission, context: ResourceContext): boolean {
    const userRole = user.projectRole || user.role || 'VIEWER';
    const permissions = this.getEffectivePermissions(userRole);

    // 1. Verificar si tiene el permiso explícito
    if (!permissions.includes(permission)) return false;

    // 2. Verificar el "Scope" o Alcance
    const scope = this.resolveScope(user, context);
    return this.validateScope(scope, context);
  }

  private resolveScope(user: any, context: ResourceContext): AccessScope {
    if (user.role === 'PLATFORM_ADMIN' || user.isSystemAdmin)
      return AccessScope.TENANT_WIDE;
    if (user.role === 'DIRECTOR_PMO') return AccessScope.PORTFOLIO_PROJECTS;

    // Si la request trae información del projectMember
    if (user.projectRole) return AccessScope.ASSIGNED_PROJECTS;

    return AccessScope.OWN_PROJECTS;
  }

  private validateScope(scope: AccessScope, context: ResourceContext): boolean {
    switch (scope) {
      case AccessScope.TENANT_WIDE:
        return true;
      case AccessScope.PORTFOLIO_PROJECTS:
        return !!context.portfolioId || !!context.projectId;
      case AccessScope.ASSIGNED_PROJECTS:
        return !!context.projectId;
      case AccessScope.OWN_PROJECTS:
        return !!context.projectId;
      default:
        return false;
    }
  }
}
