import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/create-contractor.dto';

@Injectable()
export class ContractorsService {
    constructor(private prisma: PrismaService) { }

    async create(tenantId: string, dto: CreateContractorDto) {
        return this.prisma.contractor.create({
            data: {
                ...dto,
                tenantId,
            },
        });
    }

    async findAll(tenantId: string) {
        return this.prisma.contractor.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(tenantId: string, id: string) {
        const contractor = await this.prisma.contractor.findFirst({
            where: { id, tenantId },
        });

        if (!contractor) {
            throw new NotFoundException(`Contractor not found`);
        }

        return contractor;
    }

    async update(tenantId: string, id: string, dto: UpdateContractorDto) {
        await this.findOne(tenantId, id); // Validate existence
        return this.prisma.contractor.update({
            where: { id },
            data: dto,
        });
    }

    async remove(tenantId: string, id: string) {
        await this.findOne(tenantId, id); // Validate existence
        return this.prisma.contractor.delete({
            where: { id },
        });
    }

    // --- Phase 10: Assignments ---

    async assignProject(tenantId: string, contractorId: string, projectId: string, role?: string) {
        return this.prisma.contractorProjectAssignment.create({
            data: {
                tenantId,
                contractorId,
                projectId,
                roleInProject: role,
                status: 'ACTIVE'
            }
        });
    }

    async getAssignments(tenantId: string, contractorId: string) {
        return this.prisma.contractorProjectAssignment.findMany({
            where: { tenantId, contractorId },
            include: { project: true }
        });
    }

    async getProjectAssignments(tenantId: string, projectId: string) {
        return this.prisma.contractorProjectAssignment.findMany({
            where: { tenantId, projectId },
            include: { contractor: true }
        });
    }

    async removeAssignment(tenantId: string, assignmentId: string) {
        return this.prisma.contractorProjectAssignment.delete({
            where: { id: assignmentId }
        });
    }

    // --- Phase 10: Portal Logic ---

    async getPortalTasks(tenantId: string, contractorId: string, status?: string) {
        const where: any = { tenantId, contractorId };
        if (status) where.status = status;

        const tasks = await this.prisma.projectActivity.findMany({
            where,
            include: { project: true, dependencies: true },
            orderBy: { endDate: 'asc' }
        });

        // Calculate Risk (Simple logic)
        const today = new Date();
        return tasks.map(t => {
            let risk = false;
            // Risk if overdue and not done
            if (new Date(t.endDate) < today && t.status !== 'DONE' && t.status !== 'CLOSED') risk = true;
            // Risk if blocked
            if (t.status === 'BLOCKED') risk = true;

            return { ...t, risk };
        });
    }

    async getPortalOrders(tenantId: string, contractorId: string) {
        return this.prisma.purchaseOrder.findMany({
            where: {
                vendorId: contractorId,
                // Also support legacy vendor string match if needed? For Phase 10 explicit relation is key.
            },
            include: { project: true, items: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getPortalDashboard(tenantId: string, contractorId: string) {
        const tasks = await this.getPortalTasks(tenantId, contractorId);
        const orders = await this.getPortalOrders(tenantId, contractorId);

        const tasksPending = tasks.filter(t => t.status === 'NOT_STARTED').length;
        const tasksInProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
        const tasksAtRisk = tasks.filter(t => t.risk).length;

        const openOrders = orders.filter(o => o.status === 'ISSUED' || o.status === 'PARTIAL').length;

        return {
            stats: {
                tasksPending,
                tasksInProgress,
                tasksAtRisk,
                openOrders
            },
            recentTasks: tasks.filter(t => t.risk || t.status === 'IN_PROGRESS').slice(0, 5),
            recentOrders: orders.slice(0, 5)
        };
    }
}
