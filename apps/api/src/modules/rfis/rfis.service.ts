import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRfiDto } from './dto/create-rfi.dto';
import { UpdateRfiDto } from './dto/update-rfi.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { enforceProjectScopeWhere } from '../../common/database/prisma-scope.helper';

@Injectable()
export class RfisService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateRfiDto, user: any, projectId?: string) {
    const project = await this.prisma.project.findFirst({
      where: enforceProjectScopeWhere(
        user,
        { id: createDto.projectId },
        projectId,
      ),
    });
    if (!project)
      throw new NotFoundException('Project not found or access denied');

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

  async findAll(user: any) {
    return (this.prisma as any).rFI.findMany({
      where: { project: enforceProjectScopeWhere(user) },
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: any, projectId?: string) {
    const rfi = await (this.prisma as any).rFI.findFirst({
      where: {
        id,
        project: enforceProjectScopeWhere(user, {}, projectId),
      },
      include: { project: true },
    });
    if (!rfi) throw new NotFoundException('RFI not found or access denied');
    return rfi;
  }

  async update(
    id: string,
    updateDto: UpdateRfiDto,
    user: any,
    projectId?: string,
  ) {
    await this.findOne(id, user, projectId);
    return (this.prisma as any).rFI.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string, user: any, projectId?: string) {
    await this.findOne(id, user, projectId);
    return (this.prisma as any).rFI.delete({ where: { id } });
  }
}
