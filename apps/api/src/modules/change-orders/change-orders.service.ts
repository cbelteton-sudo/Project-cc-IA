import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateChangeOrderDto } from './dto/create-change-order.dto';
import { UpdateChangeOrderDto } from './dto/update-change-order.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChangeOrdersService {
  constructor(private prisma: PrismaService) { }

  async create(createChangeOrderDto: CreateChangeOrderDto, tenantId: string) {
    // Validate project
    const project = await this.prisma.project.findUnique({
      where: { id: createChangeOrderDto.projectId },
    });

    if (!project || project.tenantId !== tenantId) {
      throw new BadRequestException('Invalid Project');
    }

    return this.prisma.changeOrder.create({
      data: createChangeOrderDto,
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.changeOrder.findMany({
      where: {
        project: {
          tenantId,
        },
      },
      include: {
        project: true,
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const co = await this.prisma.changeOrder.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!co || co.project.tenantId !== tenantId) {
      throw new NotFoundException('Change Order not found');
    }

    return co;
  }

  async update(id: string, updateChangeOrderDto: UpdateChangeOrderDto, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.changeOrder.update({
      where: { id },
      data: updateChangeOrderDto,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.changeOrder.delete({
      where: { id },
    });
  }
}
