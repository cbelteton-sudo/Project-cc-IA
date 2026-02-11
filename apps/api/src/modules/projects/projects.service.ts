import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) { }

  async create(createProjectDto: CreateProjectDto, tenantId: string) {
    return this.prisma.project.create({
      data: {
        ...createProjectDto,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.project.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { budgets: true },
        },
        sprints: {
          where: { status: 'ACTIVE' },
          select: { id: true, name: true },
          take: 1
        },
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        budgets: true,
      },
    });

    if (!project || project.tenantId !== tenantId) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, tenantId: string) {
    // Ensure ownership
    await this.findOne(id, tenantId);

    const data: any = { ...updateProjectDto };
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);
    if (data.globalBudget) data.globalBudget = Number(data.globalBudget);

    return this.prisma.project.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, tenantId: string) {
    // Ensure ownership
    await this.findOne(id, tenantId);

    return this.prisma.project.delete({
      where: { id },
    });
  }

  async reorderItems(tenantId: string, items: { id: string; type: 'ACTIVITY' | 'MILESTONE' }[]) {
    return this.prisma.$transaction(
      items.map((item, index) => {
        if (item.type === 'ACTIVITY') {
          return this.prisma.projectActivity.update({
            where: { id: item.id },
            data: { orderIndex: index } as any, // Cast to any to avoid partial type mismatch if types aren't fully generated yet
          });
        } else {
          return this.prisma.projectMilestone.update({
            where: { id: item.id },
            data: { orderIndex: index } as any,
          });
        }
      })
    );
  }
}
