import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSubcontractDto } from './dto/create-subcontract.dto';
import { UpdateSubcontractDto } from './dto/update-subcontract.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubcontractsService {
  constructor(private prisma: PrismaService) { }

  async create(createDto: CreateSubcontractDto, tenantId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: createDto.projectId }
    });
    if (!project || project.tenantId !== tenantId) throw new NotFoundException('Project not found');

    return (this.prisma as any).subcontract.create({
      data: {
        projectId: createDto.projectId,
        vendor: createDto.vendor,
        title: createDto.title,
        totalAmount: createDto.totalAmount,
        startDate: createDto.startDate ? new Date(createDto.startDate) : undefined,
        endDate: createDto.endDate ? new Date(createDto.endDate) : undefined,
        status: 'DRAFT',
      },
    });
  }

  async findAll(tenantId: string) {
    return (this.prisma as any).subcontract.findMany({
      where: { project: { tenantId } },
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const sub = await (this.prisma as any).subcontract.findUnique({
      where: { id },
      include: { project: true, estimates: true },
    });
    if (!sub || sub.project.tenantId !== tenantId) throw new NotFoundException('Subcontract not found');
    return sub;
  }

  async update(id: string, updateDto: UpdateSubcontractDto, tenantId: string) {
    await this.findOne(id, tenantId);

    const data: any = { ...updateDto };
    if (updateDto.startDate) data.startDate = new Date(updateDto.startDate);
    if (updateDto.endDate) data.endDate = new Date(updateDto.endDate);

    return (this.prisma as any).subcontract.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return (this.prisma as any).subcontract.delete({ where: { id } });
  }
}
