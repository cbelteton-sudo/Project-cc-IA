import { Injectable, Logger } from '@nestjs/common';
import { PermissionRepository } from './repositories/permission.repository';
import { AccessScope } from './permissions.matrix';

export interface ResourceContext {
  tenantId: string;
  projectId?: string;
  portfolioId?: string;
  [key: string]: any;
}

@Injectable()
export class AuthorizationService {
  private readonly logger = new Logger(AuthorizationService.name);

  constructor(private readonly permissionRepository: PermissionRepository) {}

  /**
   * Valida asíncronamente (Feature Flag aware) si el usuario tiene permiso explícito y un Scope válido.
   */
  async can(
    user: any,
    permission: string,
    context: ResourceContext,
  ): Promise<boolean> {
    const userRole = user.projectRole || user.role || 'VIEWER';

    // 1. Obtener Permisos Híbridos (DB o Legacy)
    const permissions =
      await this.permissionRepository.getEffectivePermissionsForRole(userRole);

    // 2. Verificar si tiene el permiso explícito
    if (!permissions.includes(permission)) {
      return false;
    }

    // 3. Verificar el "Scope" o Alcance
    const scope = this.resolveScope(user);
    const scopeValid = this.validateScope(scope, context);

    if (!scopeValid) {
      this.logger.warn(
        JSON.stringify({
          event: 'scope_mismatch',
          reason: 'outside_allowed_scope',
          userId: user.id || user.userId || 'system',
          tenantId: context.tenantId,
          projectId: context.projectId,
          portfolioId: context.portfolioId,
          role: userRole,
          permission,
          scope,
          timestamp: new Date().toISOString(),
        }),
      );
    }

    return scopeValid;
  }

  private resolveScope(user: any): AccessScope {
    if (user.role === 'PLATFORM_ADMIN' || user.isSystemAdmin) {
      return AccessScope.TENANT_WIDE;
    }
    if (user.role === 'DIRECTOR_PMO') {
      return AccessScope.PORTFOLIO_PROJECTS;
    }
    // Si la request trae información del projectMember
    if (user.projectRole) {
      return AccessScope.ASSIGNED_PROJECTS;
    }

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
