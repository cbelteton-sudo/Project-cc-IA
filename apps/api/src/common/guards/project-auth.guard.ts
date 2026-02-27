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
