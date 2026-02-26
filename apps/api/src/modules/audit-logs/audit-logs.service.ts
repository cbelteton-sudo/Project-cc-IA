import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateAuditLogDto {
  action: string;
  resource: string;
  resourceId: string;
  userId: string;
  tenantId: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async log(data: CreateAuditLogDto) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          userId: data.userId,
          tenantId: data.tenantId,
          metadata: data.metadata ? JSON.stringify(data.metadata) : '{}',
        },
      });
    } catch (error) {
      console.error('Failed to create audit log', error);
      // Fail silently to avoid breaking the main flow? Or throw?
      // Usually silent is better for audit unless it's critical.
    }
  }
}
