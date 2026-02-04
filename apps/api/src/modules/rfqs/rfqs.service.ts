import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { UpdateRfqDto } from './dto/update-rfq.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RfqsService {
  constructor(private prisma: PrismaService) { }

  async create(createDto: CreateRfqDto, tenantId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: createDto.projectId }
    });
    if (!project || project.tenantId !== tenantId) throw new NotFoundException('Project not found');

    return (this.prisma as any).rfq.create({
      data: {
        ...createDto,
        status: 'OPEN',
      },
    });
  }

  async findAll(tenantId: string) {
    return (this.prisma as any).rfq.findMany({
      where: { project: { tenantId } },
      include: { project: true, bids: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const rfq = await (this.prisma as any).rfq.findUnique({
      where: { id },
      include: { project: true, bids: true },
    });
    if (!rfq || rfq.project.tenantId !== tenantId) throw new NotFoundException('RFQ not found');
    return rfq;
  }

  async update(id: string, updateDto: UpdateRfqDto, tenantId: string) {
    await this.findOne(id, tenantId);
    return (this.prisma as any).rfq.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return (this.prisma as any).rfq.delete({ where: { id } });
  }
}
