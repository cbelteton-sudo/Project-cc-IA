import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateMaterialRequestDto } from './dto/create-material-request.dto';
import { UpdateMaterialRequestDto } from './dto/update-material-request.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MaterialRequestsService {
  constructor(private prisma: PrismaService) { }

  async create(createDto: CreateMaterialRequestDto, tenantId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: createDto.projectId },
    });

    if (!project || project.tenantId !== tenantId) {
      throw new BadRequestException('Invalid Project');
    }

    return this.prisma.materialRequest.create({
      data: {
        projectId: createDto.projectId,
        title: createDto.title,
        items: JSON.stringify(createDto.items),
        status: 'DRAFT',
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.materialRequest.findMany({
      where: {
        project: {
          tenantId,
        },
      },
      include: {
        project: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const req = await this.prisma.materialRequest.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!req || req.project.tenantId !== tenantId) {
      throw new NotFoundException('Material Request not found');
    }

    return {
      ...req,
      items: JSON.parse(req.items), // Parse JSON for response
    };
  }

  async update(id: string, updateDto: UpdateMaterialRequestDto, tenantId: string) {
    await this.findOne(id, tenantId);

    // Logic: Only update if not closed? For MVP, allow edits.
    const data: any = { ...updateDto };
    if (updateDto.items) { // fixed typo from 'items' check
      // We know updateDto is Partial<CreateMaterialRequestDto> essentially, 
      // but mapped types in Nest don't always carry over custom types well without DTO refinement.
      // Assuming updateDto has 'items' property if provided.
      // Actually, UpdateMaterialRequestDto extends PartialType(CreateMaterialRequestDto)
      // so it has items: CreateMaterialRequestItem[] | undefined
      data.items = JSON.stringify(updateDto.items);
    }

    return this.prisma.materialRequest.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.materialRequest.delete({
      where: { id },
    });
  }
}
