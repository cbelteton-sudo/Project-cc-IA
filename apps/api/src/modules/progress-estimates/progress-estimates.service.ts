import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProgressEstimateDto } from './dto/create-progress-estimate.dto';
import { UpdateProgressEstimateDto } from './dto/update-progress-estimate.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { enforceScopeWhere } from '../../common/database/prisma-scope.helper';

@Injectable()
export class ProgressEstimatesService {
  constructor(private prisma: PrismaService) {}

  async create(
    createDto: CreateProgressEstimateDto,
    user: any,
    projectId: string,
  ) {
    const subcontract = await (this.prisma as any).subcontract.findFirst({
      where: {
        id: createDto.subcontractId,
        project: enforceScopeWhere(user, {}, projectId),
      },
    });
    if (!subcontract) {
      throw new NotFoundException('Subcontract not found or access denied');
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

  async findAll(user: any) {
    return (this.prisma as any).progressEstimate.findMany({
      where: {
        subcontract: {
          project: enforceScopeWhere(user),
        },
      },
      include: { subcontract: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: any, projectId?: string) {
    const est = await (this.prisma as any).progressEstimate.findFirst({
      where: {
        id,
        subcontract: {
          project: enforceScopeWhere(user, {}, projectId),
        },
      },
      include: {
        subcontract: {
          include: { project: true },
        },
      },
    });
    if (!est)
      throw new NotFoundException('Estimate not found or access denied');
    return est;
  }

  async update(
    id: string,
    updateDto: UpdateProgressEstimateDto,
    user: any,
    projectId?: string,
  ) {
    await this.findOne(id, user, projectId);

    const data: any = { ...updateDto };
    if (updateDto.periodStart)
      data.periodStart = new Date(updateDto.periodStart);
    if (updateDto.periodEnd) data.periodEnd = new Date(updateDto.periodEnd);

    return (this.prisma as any).progressEstimate.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, user: any, projectId?: string) {
    await this.findOne(id, user, projectId);
    return (this.prisma as any).progressEstimate.delete({ where: { id } });
  }
}
