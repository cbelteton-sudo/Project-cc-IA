
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PMDashboardService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService
    ) { }

    async getDashboardData(projectId: string, tenantId: string) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            include: { tenant: true }
        });

        if (!project || project.tenantId !== tenantId) throw new NotFoundException('Project not found');
        if (!project.enablePMDashboard) throw new ForbiddenException('PM Dashboard disabled for this project');

        // 1. Stalled Activities (No update in 3 days)
        // Simplify: activities IN_PROGRESS with lastUpdateAt < 3 days ago
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const stalledActivities = await this.prisma.projectActivity.findMany({
            where: {
                projectId,
                status: 'IN_PROGRESS',
                lastUpdateAt: { lt: threeDaysAgo }
            },
            include: { contractor: true, assignedUser: true },
            take: 20
        });

        // 2. Blocked Activities
        const blockedActivities = await this.prisma.projectActivity.findMany({
            where: { projectId, status: 'BLOCKED' },
            include: { contractor: true, assignedUser: true }
        });

        // 3. Issues (Open and Overdue)
        const issues = await this.prisma.issue.findMany({
            where: { projectId, status: { not: 'CLOSED' } },
            include: { contractor: true },
            orderBy: { dueDate: 'asc' }
        });

        const overdueIssues = issues.filter(i => i.dueDate && new Date(i.dueDate) < new Date());
        const atRiskIssues = issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH');

        // 4. Top Contractors (Blockers & Overdue)
        // Map data in code for P0
        const contractorStats = new Map<string, { name: string, blocked: number, overdue: number }>();

        blockedActivities.forEach(a => {
            if (a.contractor) {
                const current = contractorStats.get(a.contractor.id) || { name: a.contractor.name, blocked: 0, overdue: 0 };
                current.blocked++;
                contractorStats.set(a.contractor.id, current);
            }
        });

        overdueIssues.forEach(i => {
            if (i.contractor) {
                const current = contractorStats.get(i.contractor.id) || { name: i.contractor.name, blocked: 0, overdue: 0 };
                current.overdue++;
                contractorStats.set(i.contractor.id, current);
            }
        });

        const topContractors = Array.from(contractorStats.values())
            .sort((a, b) => (b.blocked + b.overdue) - (a.blocked + a.overdue))
            .slice(0, 5);

        // 5. PPC Lite (Last 4 weeks)
        // Simplified: Find activities with dueDate in range. Check if status is DONE/CLOSED.
        // For real PPC we need commit logs, but for "Lite" we use current snapshot + dates.
        // This is an approximation.

        return {
            stalled: stalledActivities,
            blocked: blockedActivities,
            issues: {
                total: issues.length,
                overdue: overdueIssues,
                atRisk: atRiskIssues
            },
            topContractors,
            projectName: project.name
        };
    }

    async blockActivity(activityId: string, tenantId: string, dto: any, userId: string) {
        const activity = await this.prisma.projectActivity.findUnique({ where: { id: activityId } });
        // Validate tenant logic here if strict

        const updated = await this.prisma.projectActivity.update({
            where: { id: activityId },
            data: {
                status: 'BLOCKED',
                blockedReason: dto.reason,
                blockedComment: dto.comment,
                blockedEta: dto.eta ? new Date(dto.eta) : null,
                blockedOwnerUserId: dto.ownerId,
                lastUpdateAt: new Date()
            }
        });

        // Notification?
        if (dto.ownerId) {
            await this.notificationsService.create(
                dto.ownerId,
                'BLOCKED',
                'ACTIVITY',
                activityId,
                `Actividad bloqueada: ${activity?.name}. Razón: ${dto.reason}`
            );
        }

        return updated;
    }

    async commitActivity(activityId: string, tenantId: string, customDueDate: string) {
        return this.prisma.projectActivity.update({
            where: { id: activityId },
            data: {
                committedDate: new Date(customDueDate),
                lastUpdateAt: new Date()
            }
        });
    }

    async requestUpdate(activityId: string, requesterName: string) {
        const activity = await this.prisma.projectActivity.findUnique({
            where: { id: activityId },
            include: { assignedUser: true }
        });

        if (activity && activity.assignedUserId) {
            await this.notificationsService.create(
                activity.assignedUserId,
                'REQUEST_UPDATE',
                'ACTIVITY',
                activityId,
                `${requesterName} solicitó un update de la actividad: ${activity.name}`
            );
            return { success: true };
        }
        return { success: false, message: 'No assigned user' };
    }
}
