import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRfiDto } from './dto/create-rfi.dto';
import { UpdateRfiDto } from './dto/update-rfi.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RfisService {
  constructor(private prisma: PrismaService) { }

  async create(createDto: CreateRfiDto, tenantId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: createDto.projectId }
    });
    if (!project || project.tenantId !== tenantId) throw new NotFoundException('Project not found');

    return (this.prisma as any).rFI.create({
      data: {
        projectId: createDto.projectId,
        code: createDto.code,
        subject: createDto.subject,
        question: createDto.question,
        assignedTo: createDto.assignedTo,
        status: 'OPEN',
      },
    });
  }

  async findAll(tenantId: string) {
    return (this.prisma as any).rFI.findMany({
      where: { project: { tenantId } },
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const rfi = await (this.prisma as any).rFI.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!rfi || rfi.project.tenantId !== tenantId) throw new NotFoundException('RFI not found');
    return rfi;
  }

  async update(id: string, updateDto: UpdateRfiDto, tenantId: string) {
    await this.findOne(id, tenantId);
    return (this.prisma as any).rFI.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return (this.prisma as any).rFI.delete({ where: { id } });
  }
}
