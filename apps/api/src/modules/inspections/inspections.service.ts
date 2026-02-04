import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InspectionsService {
  constructor(private prisma: PrismaService) { }

  async create(createDto: CreateInspectionDto, tenantId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: createDto.projectId }
    });
    if (!project || project.tenantId !== tenantId) throw new NotFoundException('Project not found');

    return (this.prisma as any).inspection.create({
      data: {
        projectId: createDto.projectId,
        date: new Date(createDto.date),
        type: createDto.type,
        status: createDto.status || 'PENDING',
        notes: createDto.notes,
      },
    });
  }

  async findAll(tenantId: string) {
    return (this.prisma as any).inspection.findMany({
      where: { project: { tenantId } },
      include: { project: true },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const inspection = await (this.prisma as any).inspection.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!inspection || inspection.project.tenantId !== tenantId) throw new NotFoundException('Inspection not found');
    return inspection;
  }

  async update(id: string, updateDto: UpdateInspectionDto, tenantId: string) {
    await this.findOne(id, tenantId);

    const data: any = { ...updateDto };
    if (updateDto.date) data.date = new Date(updateDto.date);

    return (this.prisma as any).inspection.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return (this.prisma as any).inspection.delete({ where: { id } });
  }
}
