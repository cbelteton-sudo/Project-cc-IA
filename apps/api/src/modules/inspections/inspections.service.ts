import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { enforceScopeWhere } from '../../common/database/prisma-scope.helper';

@Injectable()
export class InspectionsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateInspectionDto, user: any) {
    const project = await this.prisma.project.findUnique({
      where: enforceScopeWhere(
        user,
        { id: createDto.projectId },
        createDto.projectId,
      ),
    });
    if (!project)
      throw new NotFoundException('Project not found or access denied');

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

  async findAll(user: any) {
    return (this.prisma as any).inspection.findMany({
      where: enforceScopeWhere(user),
      include: { project: true },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string, user: any, projectId?: string) {
    const inspection = await (this.prisma as any).inspection.findUnique({
      where: enforceScopeWhere(user, { id }, projectId),
      include: { project: true },
    });
    if (!inspection)
      throw new NotFoundException('Inspection not found or access denied');
    return inspection;
  }

  async update(
    id: string,
    updateDto: UpdateInspectionDto,
    user: any,
    projectId?: string,
  ) {
    await this.findOne(id, user, projectId);

    const data: any = { ...updateDto };
    if (updateDto.date) data.date = new Date(updateDto.date);

    return (this.prisma as any).inspection.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, user: any, projectId?: string) {
    await this.findOne(id, user, projectId);
    return (this.prisma as any).inspection.delete({ where: { id } });
  }
}
