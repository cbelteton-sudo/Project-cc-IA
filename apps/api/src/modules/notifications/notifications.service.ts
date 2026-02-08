
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, type: string, entityType: string, entityId: string, message: string) {
        return this.prisma.notification.create({
            data: {
                userId,
                type, // DUE_SOON, OVERDUE, NO_UPDATE, MENTION, REQUEST_UPDATE
                entityType, // ACTIVITY, ISSUE
                entityId,
                message,
            },
        });
    }

    async findAll(userId: string) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    async markAsRead(id: string, userId: string) {
        return this.prisma.notification.updateMany({
            where: { id, userId },
            data: { readAt: new Date() },
        });
    }

    async listUnread(userId: string) {
        return this.prisma.notification.count({
            where: { userId, readAt: null },
        });
    }
}
