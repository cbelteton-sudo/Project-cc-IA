import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectAuthGuard implements CanActivate {
  private readonly logger = new Logger(ProjectAuthGuard.name);

  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const projectId =
      request.params.id ||
      request.params.projectId ||
      request.query.projectId ||
      request.body?.projectId;

    if (!projectId || projectId === 'undefined' || projectId === 'null') {
      // If not found in params/query, try body? Or just fail if guard is applied.
      // Assuming strict usage on routes with :id or :projectId
      throw new ForbiddenException(
        'Project Context Required or Invalid Project ID',
      );
    }

    const isGlobalAdmin = [
      'ADMIN',
      'ADMINISTRADOR',
      'PLATFORM_ADMIN',
      'DIRECTOR_PMO',
    ].includes(user.role);

    // Bypass for Global Admin
    if (isGlobalAdmin) {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project || project.tenantId !== user.tenantId) {
        throw new ForbiddenException('Access to this project is denied');
      }
      request.projectMember = {
        role: 'DIRECTOR', // Pseudo-role to pass permissions guard
        status: 'ACTIVE',
        projectId,
        userId: user.id || user.userId,
      };
      return true;
    }

    // Explicit check for Global Project Manager
    if (user.role === 'PROJECT_MANAGER') {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project || project.tenantId !== user.tenantId) {
        throw new ForbiddenException('Access to this project is denied');
      }

      // Must be the assigned project manager (Construye)
      if (project.projectManagerId !== (user.id || user.userId)) {
        this.logger.warn(
          JSON.stringify({
            event: 'access_denied',
            reason: 'not_the_assigned_project_manager',
            userId: user.id || user.userId,
            tenantId: user.tenantId,
            projectId,
            endpoint: request.url,
            timestamp: new Date().toISOString(),
          }),
        );
        throw new ForbiddenException(
          'Access to this project is denied. You are not the assigned Project Manager.',
        );
      }

      request.projectMember = {
        role: 'PROJECT_MANAGER',
        status: 'ACTIVE',
        projectId,
        userId: user.id || user.userId,
      };
      return true;
    }

    const membership = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id || user.userId,
        },
      },
      include: {
        contractor: true,
        project: true, // Maybe needed?
      },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      this.logger.warn(
        JSON.stringify({
          event: 'access_denied',
          reason: !membership ? 'not_a_member' : 'inactive_member',
          userId: user.id || user.userId,
          tenantId: user.tenantId,
          projectId,
          endpoint: request.url,
          timestamp: new Date().toISOString(),
        }),
      );
      throw new ForbiddenException('Access to this project is denied');
    }

    // Attach to request
    request.projectMember = membership;

    return true;
  }
}
