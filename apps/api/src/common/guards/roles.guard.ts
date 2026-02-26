import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }

    // User role is a string in DB (ADMIN, USER, etc.)
    // Special handling for ADMINISTRADOR as equivalent to ADMIN
    if (requiredRoles.includes('ADMIN') && user.role === 'ADMINISTRADOR') {
      return true;
    }
    return requiredRoles.includes(user.role);
  }
}
