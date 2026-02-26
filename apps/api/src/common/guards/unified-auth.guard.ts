import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthorizationService } from '../auth/authorization.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Permission } from '../constants/permissions';

@Injectable()
export class UnifiedAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authzService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No roles defined, assumes public or allowed
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user || request.projectMember; // Ajustable según el flujo de login

    if (!user) {
      throw new ForbiddenException('User context not found');
    }

    const requestContext = {
      tenantId: user.tenantId,
      projectId:
        request.params.projectId ||
        request.query.projectId ||
        request.body?.projectId,
    };

    for (const permission of requiredPermissions) {
      if (!this.authzService.can(user, permission, requestContext)) {
        throw new ForbiddenException(
          `Missing required scope or permission: ${permission}`,
        );
      }
    }

    return true;
  }
}
