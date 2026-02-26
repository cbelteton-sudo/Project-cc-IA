import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 1. Ensure user is authenticated (should rely on JwtAuthGuard running first)
    if (!user) {
      return false;
    }

    // 2. Extract Project ID from params or body
    const projectId =
      request.params.projectId ||
      request.body.projectId ||
      request.query.projectId;

    if (!projectId) {
      // If no project context, this guard might be misplaced or route is general
      return true;
    }

    // 3. Admin Bypass
    if (
      user.role === 'ADMIN' ||
      user.role === 'ADMINISTRADOR' ||
      user.role === 'TENANT_ADMIN'
    ) {
      return true;
    }

    // 4. Check Membership
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.sub, // 'sub' is userId from JWT payload
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this project');
    }

    // Optional: Check specific roles if needed (future)
    // const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());

    return true;
  }
}
