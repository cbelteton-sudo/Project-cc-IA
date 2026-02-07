import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIssueDto } from './dto/create-issue.dto';

@Injectable()
export class IssuesService {
    constructor(private prisma: PrismaService) { }

    create(dto: CreateIssueDto) {
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
                createdBy: 'SYSTEM_APP', // Should be user ID
            },
        });
    }

    findAll(projectId: string) {
        return this.prisma.issue.findMany({
            where: { projectId },
            include: { activity: true, comments: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    updateStatus(id: string, status: string) {
        return this.prisma.issue.update({
            where: { id },
            data: { status }
        });
    }
}
