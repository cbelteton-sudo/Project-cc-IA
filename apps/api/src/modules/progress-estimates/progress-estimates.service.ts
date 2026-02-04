import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProgressEstimateDto } from './dto/create-progress-estimate.dto';
import { UpdateProgressEstimateDto } from './dto/update-progress-estimate.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProgressEstimatesService {
  constructor(private prisma: PrismaService) { }

  async create(createDto: CreateProgressEstimateDto, tenantId: string) {
    const subcontract = await (this.prisma as any).subcontract.findUnique({
      where: { id: createDto.subcontractId },
      include: { project: true },
    });
    if (!subcontract || subcontract.project.tenantId !== tenantId) {
      throw new NotFoundException('Subcontract not found');
    }

    return (this.prisma as any).progressEstimate.create({
      data: {
        subcontractId: createDto.subcontractId,
        periodStart: new Date(createDto.periodStart),
        periodEnd: new Date(createDto.periodEnd),
        amount: createDto.amount,
        status: 'SUBMITTED',
      },
    });
  }

  async findAll(tenantId: string) {
    return (this.prisma as any).progressEstimate.findMany({
      where: {
        subcontract: {
          project: { tenantId }
        }
      },
      include: { subcontract: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const est = await (this.prisma as any).progressEstimate.findUnique({
      where: { id },
      include: {
        subcontract: {
          include: { project: true }
        }
      },
    });
    if (!est || est.subcontract.project.tenantId !== tenantId) throw new NotFoundException('Estimate not found');
    return est;
  }

  async update(id: string, updateDto: UpdateProgressEstimateDto, tenantId: string) {
    await this.findOne(id, tenantId);

    const data: any = { ...updateDto };
    if (updateDto.periodStart) data.periodStart = new Date(updateDto.periodStart);
    if (updateDto.periodEnd) data.periodEnd = new Date(updateDto.periodEnd);

    return (this.prisma as any).progressEstimate.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return (this.prisma as any).progressEstimate.delete({ where: { id } });
  }
}
