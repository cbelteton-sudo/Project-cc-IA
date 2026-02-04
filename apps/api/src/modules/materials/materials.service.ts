import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) { }

  async create(createMaterialDto: CreateMaterialDto, tenantId: string) {
    return this.prisma.material.create({
      data: {
        ...createMaterialDto,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.material.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const material = await this.prisma.material.findUnique({
      where: { id },
    });

    if (!material || material.tenantId !== tenantId) {
      throw new NotFoundException('Material not found');
    }

    return material;
  }

  async update(id: string, updateMaterialDto: UpdateMaterialDto, tenantId: string) {
    await this.findOne(id, tenantId); // validate ownership

    return this.prisma.material.update({
      where: { id },
      data: updateMaterialDto,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId); // validate ownership

    return this.prisma.material.delete({
      where: { id },
    });
  }
}
