import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';

@Injectable()
export class IssuesService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateIssueDto, userId: string = 'SYSTEM') {
        // Auto-generate code if not provided
        const project = await this.prisma.project.findUnique({
            where: { id: dto.projectId },
            select: { enablePunchListPro: true }
        });

        let code = null;
        if (project?.enablePunchListPro) {
            // Simple auto-increment strategy via count (not transaction safe but consistent enough for MVP)
            const count = await this.prisma.issue.count({ where: { projectId: dto.projectId, type: 'PUNCH_LIST' } });
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
                createdBy: userId,

                // Punch List Pro
                type: project?.enablePunchListPro ? 'PUNCH_LIST' : 'ISSUE',
                code: code,
                trade: dto.trade,
                locationBuilding: dto.locationBuilding,
                locationLevel: dto.locationLevel,
                locationZone: dto.locationZone,
                contractorId: dto.contractorId
            },
        });
    }

    findAll(projectId: string) {
        return this.prisma.issue.findMany({
            where: { projectId },
            include: {
                activity: true,
                comments: true,
                contractor: true // Include contractor details
            },
            orderBy: [{ status: 'asc' }, { createdAt: 'desc' }]
        });
    }

    async update(id: string, dto: UpdateIssueDto, userId: string) {
        const issue = await this.prisma.issue.findUnique({ where: { id } });
        if (!issue) throw new BadRequestException('Issue not found');

        const updateData: any = { ...dto };
        if (dto.dueDate) updateData.dueDate = new Date(dto.dueDate);

        // Workflow Transitions
        if (dto.status && dto.status !== issue.status) {
            if (dto.status === 'READY_FOR_VALIDATION') {
                updateData.readyForValidationAt = new Date();
                // TODO: Verify min photos here if enforcement is strict
            } else if (dto.status === 'CLOSED') {
                updateData.validatedAt = new Date();
                updateData.validatedBy = userId;
                updateData.closedAt = new Date();
            } else if (dto.status === 'REOPENED') {
                updateData.reopenedAt = new Date();
                updateData.reopenedBy = userId;
            }
        }

        return this.prisma.issue.update({
            where: { id },
            data: updateData
        });
    }

    updateStatus(id: string, status: string) {
        return this.prisma.issue.update({
            where: { id },
            data: { status }
        });
    }

    async createComment(issueId: string, text: string, userId: string) {
        return this.prisma.comment.create({
            data: {
                issueId,
                text,
                createdBy: userId
            }
        });
    }
}
