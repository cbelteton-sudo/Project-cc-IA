import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MilestonesService {
    constructor(private prisma: PrismaService) { }

    async create(tenantId: string, projectId: string, dto: any) {
        return this.prisma.projectMilestone.create({
            data: {
                tenantId,
                projectId,
                name: dto.name,
                date: new Date(dto.date),
                description: dto.description,
                status: 'PLANNED',
                activityId: dto.activityId || undefined
            }
        });
    }

    async findAll(tenantId: string, projectId: string) {
        return this.prisma.projectMilestone.findMany({
            where: { tenantId, projectId },
            include: { activity: { select: { id: true, name: true } } },
            orderBy: { date: 'asc' }
        });
    }

    async update(tenantId: string, id: string, dto: any) {
        const milestone = await this.prisma.projectMilestone.findFirst({
            where: { id, tenantId }
        });
        if (!milestone) throw new NotFoundException('Milestone not found');

        return this.prisma.projectMilestone.update({
            where: { id },
            data: {
                name: dto.name,
                date: dto.date ? new Date(dto.date) : undefined,
                description: dto.description,
                status: dto.status
            }
        });
    }

    async remove(tenantId: string, id: string) {
        const milestone = await this.prisma.projectMilestone.findFirst({
            where: { id, tenantId }
        });
        if (!milestone) throw new NotFoundException('Milestone not found');

        return this.prisma.projectMilestone.delete({ where: { id } });
    }
}
