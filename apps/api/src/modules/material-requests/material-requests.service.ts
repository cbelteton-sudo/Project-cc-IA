import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateMaterialRequestDto } from './dto/create-material-request.dto';
import { UpdateMaterialRequestDto } from './dto/update-material-request.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { enforceScopeWhere } from '../../common/database/prisma-scope.helper';

@Injectable()
export class MaterialRequestsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateMaterialRequestDto, user: any) {
    const project = await this.prisma.project.findFirst({
      where: enforceScopeWhere(user, { id: createDto.projectId }),
    });

    if (!project) {
      throw new BadRequestException('Invalid Project or access denied');
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

  async findAll(projectId: string, user: any) {
    if (projectId) {
      const project = await this.prisma.project.findFirst({
        where: enforceScopeWhere(user, { id: projectId }),
      });
      if (!project)
        throw new NotFoundException('Project not found or access denied');
    }

    return this.prisma.materialRequest.findMany({
      where: projectId
        ? { projectId }
        : { project: enforceScopeWhere(user, {}) },
      include: {
        project: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, projectId: string, user: any) {
    if (projectId) {
      const project = await this.prisma.project.findFirst({
        where: enforceScopeWhere(user, { id: projectId }),
      });
      if (!project)
        throw new NotFoundException('Project not found or access denied');
    }

    const req = await this.prisma.materialRequest.findUnique({
      where: { id },
      include: { project: true },
    });

    if (
      !req ||
      req.project.tenantId !== user.tenantId ||
      (projectId && req.projectId !== projectId)
    ) {
      throw new NotFoundException('Material Request not found');
    }

    const projectAccess = await this.prisma.project.findFirst({
      where: enforceScopeWhere(user, { id: req.projectId }),
    });
    if (!projectAccess)
      throw new NotFoundException(
        'Material Request not found or access denied',
      );

    return {
      ...req,
      items: JSON.parse(req.items), // Parse JSON for response
    };
  }

  async update(
    id: string,
    updateDto: UpdateMaterialRequestDto,
    projectId: string,
    user: any,
  ) {
    await this.findOne(id, projectId, user);

    // Logic: Only update if not closed? For MVP, allow edits.
    const data: any = { ...updateDto };
    if (updateDto.items) {
      // fixed typo from 'items' check
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

  async remove(id: string, projectId: string, user: any) {
    await this.findOne(id, projectId, user);
    return this.prisma.materialRequest.delete({
      where: { id },
    });
  }
}
