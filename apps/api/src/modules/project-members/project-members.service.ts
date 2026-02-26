import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectRole } from '../../common/enums/project-role.enum';

import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class ProjectMembersService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  async addMember(
    projectId: string,
    dto: import('./dto/add-member.dto').AddMemberDto,
    actorId: string,
    tenantId: string,
  ) {
    const { email, role, name, phone, contractorId } = dto;
    console.log('[ProjectMembersService] addMember step 0: email=', email);

    // 1. Find User by Email
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(
        '[ProjectMembersService] addMember step 1: user not found, creating user...',
      );
      // Create user if not found
      user = await this.prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          phone: phone || null,
          role: 'USER', // Base system role
          status: 'INVITED',
          tenantId,
          projectId,
          contractorId: contractorId || null,
        },
      });
      console.log(
        '[ProjectMembersService] addMember step 2: user created with id=',
        user.id,
      );
    } else {
      // Optional: Update name/phone if provided and they differ?
      // Let's just update if provided to ensure they stay up to date
      if (
        (name && user.name !== name) ||
        (phone && user.phone !== phone) ||
        (contractorId && user.contractorId !== contractorId)
      ) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            name: name || user.name,
            phone: phone || user.phone,
            contractorId:
              contractorId !== undefined ? contractorId : user.contractorId,
          },
        });
      }
    }
    console.log(
      '[ProjectMembersService] addMember step 3: checking if already member...',
    );

    // 2. Check if already member
    const existing = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id,
        },
      },
    });

    if (existing) {
      throw new ConflictException('User is already a member of this project');
    }

    // 3. Add Member
    const member = await this.prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
        role,
      },
    });

    // 4. Audit Log
    await this.auditLogsService.log({
      action: 'MEMBER_ADDED',
      resource: 'Project',
      resourceId: projectId,
      userId: actorId,
      tenantId: tenantId,
      metadata: { addedUserId: user.id, role, memberEmail: email },
    });

    return member;
  }

  async getMembers(projectId: string) {
    return this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true, // System role
            contractorId: true, // Return contractorId to hydrate frontend selects
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async removeMember(
    projectId: string,
    userId: string,
    actorId: string,
    tenantId: string,
  ) {
    // Check if member exists first? Or just delete (Prisma throws if not found? No, delete expects where unique)
    try {
      const result = await this.prisma.projectMember.delete({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      });

      await this.auditLogsService.log({
        action: 'MEMBER_REMOVED',
        resource: 'Project',
        resourceId: projectId,
        userId: actorId,
        tenantId: tenantId,
        metadata: { removedUserId: userId },
      });

      return result;
    } catch (error) {
      // Handle P2025 (Record not found) if verified
      throw new NotFoundException('Member not found');
    }
  }

  async updateMemberRole(
    projectId: string,
    userId: string,
    role: ProjectRole,
    contractorId: string | undefined,
    actorId: string,
    tenantId: string,
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      const pm = await tx.projectMember.update({
        where: {
          projectId_userId: { projectId, userId },
        },
        data: { role },
      });

      if (contractorId !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: { contractorId: contractorId === '' ? null : contractorId },
        });
      }

      return pm;
    });

    await this.auditLogsService.log({
      action: 'MEMBER_ROLE_UPDATED',
      resource: 'Project',
      resourceId: projectId,
      userId: actorId,
      tenantId: tenantId,
      metadata: { targetUserId: userId, newRole: role },
    });

    return result;
  }
}
