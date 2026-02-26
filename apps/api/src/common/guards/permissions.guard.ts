import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, ROLE_PERMISSIONS } from '../constants/permissions';
import { ProjectRole } from '../constants/roles';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const membership = request.projectMember;

    if (!membership) {
      throw new ForbiddenException(
        'Project membership context missing. Ensure ProjectAuthGuard is used.',
      );
    }

    const userRole = membership.role as ProjectRole;
    // Fallback if role string in DB doesn't match Enum (shouldn't happen with strict typing but good to be safe)
    if (!Object.values(ProjectRole).includes(userRole)) {
      console.warn(`Unknown role encountered: ${userRole}`);
      throw new ForbiddenException('Invalid Role Configuration');
    }

    const userPermissions = ROLE_PERMISSIONS[userRole] || [];

    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      const logger = new Logger('PermissionsGuard');
      logger.warn(
        JSON.stringify({
          event: 'access_denied',
          reason: 'insufficient_permissions',
          userId: request.user?.id || request.user?.userId,
          tenantId: request.user?.tenantId,
          projectId: membership.projectId,
          role: userRole,
          requiredPermissions,
          endpoint: request.url,
          timestamp: new Date().toISOString(),
        }),
      );
      throw new ForbiddenException(
        `Insufficient Permissions: Required ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
