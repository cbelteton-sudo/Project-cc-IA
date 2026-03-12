import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MilestonesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, projectId: string, dto: any) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId, tenantId },
    });
    if (!project) throw new NotFoundException('Project not found');

    const mDate = new Date(dto.date);
    mDate.setHours(0, 0, 0, 0);

    if (project.startDate && project.endDate) {
      const pStart = new Date(project.startDate);
      pStart.setHours(0, 0, 0, 0);
      const pEnd = new Date(project.endDate);
      pEnd.setHours(23, 59, 59, 999);

      if (mDate < pStart || mDate > pEnd) {
        throw new BadRequestException(
          `La fecha del hito debe estar dentro del rango general del proyecto: ${pStart.toLocaleDateString('es-ES')} al ${pEnd.toLocaleDateString('es-ES')}`,
        );
      }
    }

    if (dto.activityId) {
      const activity = await this.prisma.projectActivity.findUnique({
        where: { id: dto.activityId },
      });
      if (activity) {
        const aStart = new Date(activity.startDate);
        aStart.setHours(0, 0, 0, 0);
        const aEnd = new Date(activity.endDate);
        aEnd.setHours(23, 59, 59, 999);

        if (mDate < aStart || mDate > aEnd) {
          throw new BadRequestException(
            `La fecha del hito debe estar dentro del rango de su actividad principal: ${aStart.toLocaleDateString('es-ES')} al ${aEnd.toLocaleDateString('es-ES')}`,
          );
        }
      }
    }

    return this.prisma.projectMilestone.create({
      data: {
        tenantId,
        projectId,
        name: dto.name,
        date: new Date(dto.date),
        description: dto.description,
        status: 'PLANNED',
        activityId: dto.activityId || undefined,
      },
    });
  }

  async findAll(tenantId: string, projectId: string) {
    return this.prisma.projectMilestone.findMany({
      where: { tenantId, projectId },
      include: { activity: { select: { id: true, name: true } } },
      orderBy: { date: 'asc' },
    });
  }

  async update(tenantId: string, id: string, dto: any) {
    const milestone = await this.prisma.projectMilestone.findFirst({
      where: { id, tenantId },
    });
    if (!milestone) throw new NotFoundException('Milestone not found');

    return this.prisma.projectMilestone.update({
      where: { id },
      data: {
        name: dto.name,
        date: dto.date ? new Date(dto.date) : undefined,
        description: dto.description,
        status: dto.status,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const milestone = await this.prisma.projectMilestone.findFirst({
      where: { id, tenantId },
    });
    if (!milestone) throw new NotFoundException('Milestone not found');

    return this.prisma.projectMilestone.delete({ where: { id } });
  }

  async reorder(tenantId: string, orderedIds: string[]) {
    // Validate ownership of at least one to ensure tenant safety,
    // or just rely on the updateMany if we could, but updateMany doesn't support different values.
    // Transaction is best.

    return this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.projectMilestone.update({
          where: { id, tenantId }, // Ensure tenant isolation
          data: { orderIndex: index },
        }),
      ),
    );
  }
}
