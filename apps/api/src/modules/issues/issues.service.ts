import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import {
  enforceScopeWhere,
  enforceProjectScopeWhere,
} from '../../common/database/prisma-scope.helper';

@Injectable()
export class IssuesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateIssueDto, user: any) {
    // Verify Access Context
    const project = await this.prisma.project.findFirst({
      where: enforceProjectScopeWhere(user, { id: dto.projectId }),
      select: { enablePunchListPro: true },
    });
    if (!project)
      throw new NotFoundException('Project not found or access denied');

    let code = null;
    if (project?.enablePunchListPro) {
      // Simple auto-increment strategy via count (not transaction safe but consistent enough for MVP)
      const count = await this.prisma.issue.count({
        where: { projectId: dto.projectId, type: 'PUNCH_LIST' },
      });
      code = count + 1;
    }

    return this.prisma.issue.create({
      data: {
        projectId: dto.projectId,
        activityId: dto.activityId,
        title: dto.title,
        description: dto.description,
        severity: dto.severity || 'MEDIUM',
        status: 'OPEN',
        ownerUserId: dto.ownerUserId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        createdBy: user.id || 'SYSTEM',

        // Punch List Pro
        type: project?.enablePunchListPro ? 'PUNCH_LIST' : 'ISSUE',
        code: code,
        trade: dto.trade,
        locationBuilding: dto.locationBuilding,
        locationLevel: dto.locationLevel,
        locationZone: dto.locationZone,
        contractorId: dto.contractorId,
      },
    });
  }

  async findAll(projectId: string, user: any) {
    const project = await this.prisma.project.findFirst({
      where: enforceProjectScopeWhere(user, { id: projectId }),
    });
    if (!project)
      throw new NotFoundException('Project not found or access denied');

    return this.prisma.issue.findMany({
      where: { projectId },
      include: {
        activity: true,
        comments: true,
        contractor: true, // Include contractor details
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async update(id: string, dto: UpdateIssueDto, user: any, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: enforceProjectScopeWhere(user, { id: projectId }),
    });
    if (!project)
      throw new NotFoundException('Project not found or access denied');

    const issue = await this.prisma.issue.findUnique({ where: { id } });
    if (!issue || issue.projectId !== projectId)
      throw new NotFoundException('Issue not found');

    const updateData: any = { ...dto };
    if (dto.dueDate) updateData.dueDate = new Date(dto.dueDate);

    // Workflow Transitions
    if (dto.status && dto.status !== issue.status) {
      if (dto.status === 'READY_FOR_VALIDATION') {
        updateData.readyForValidationAt = new Date();
        // TODO: Verify min photos here if enforcement is strict
      } else if (dto.status === 'CLOSED') {
        updateData.validatedAt = new Date();
        updateData.validatedBy = user.id;
        updateData.closedAt = new Date();
      } else if (dto.status === 'REOPENED') {
        updateData.reopenedAt = new Date();
        updateData.reopenedBy = user.id;
      }
    }

    return this.prisma.issue.update({
      where: { id },
      data: updateData,
    });
  }

  async updateStatus(id: string, status: string, user: any, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: enforceProjectScopeWhere(user, { id: projectId }),
    });
    if (!project)
      throw new NotFoundException('Project not found or access denied');

    const issue = await this.prisma.issue.findUnique({ where: { id } });
    if (!issue || issue.projectId !== projectId)
      throw new NotFoundException('Issue not found');

    return this.prisma.issue.update({
      where: { id },
      data: { status },
    });
  }

  async createComment(
    issueId: string,
    text: string,
    user: any,
    projectId: string,
  ) {
    const project = await this.prisma.project.findFirst({
      where: enforceProjectScopeWhere(user, { id: projectId }),
    });
    if (!project)
      throw new NotFoundException('Project not found or access denied');

    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
    });
    if (!issue || issue.projectId !== projectId)
      throw new NotFoundException('Issue not found');

    return this.prisma.comment.create({
      data: {
        issueId,
        text,
        createdBy: user.id,
      },
    });
  }
}
