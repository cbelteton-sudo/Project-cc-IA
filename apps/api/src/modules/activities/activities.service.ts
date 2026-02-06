import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateActivityDto, UpdateActivityDto, AddDependencyDto, CloseActivityDto } from './dto/create-activity.dto';

@Injectable()
export class ActivitiesService {
    constructor(private prisma: PrismaService) { }

    async create(tenantId: string, dto: CreateActivityDto) {
        try {
            console.log('CREATE ACTIVITY START', { tenantId, dto });

            // 1. Verify Project exists and dates are valid
            const project = await this.prisma.project.findFirst({
                where: { id: dto.projectId, tenantId },
            });
            if (!project) throw new NotFoundException('Project not found (check tenant/project id)');

            console.log('Project found:', project.id);

            const start = new Date(dto.startDate);
            const end = new Date(dto.endDate);
            console.log('Dates parsed:', { start, end });

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                throw new BadRequestException('Invalid date format');
            }

            if (start > end) throw new BadRequestException('Start date must be before end date');

            // 2. Auto-generate code if missing (Simple Random for MVP)
            let code = dto.code;
            if (!code) {
                const prefix = project.name.substring(0, 3).toUpperCase();
                const random = Math.random().toString(36).substring(2, 7).toUpperCase();
                code = `${prefix}-${random}`;
            }

            // Safe parse weight
            const weight = Number(dto.plannedWeight);
            const safeWeight = isNaN(weight) ? 0 : weight;

            // Sanitize inputs (Frontend might send "" for optional fields)
            const safeContractorId = dto.contractorId ? dto.contractorId : undefined;
            const safeParentId = dto.parentId ? dto.parentId : undefined;

            const result = await this.prisma.projectActivity.create({
                data: {
                    tenantId,
                    projectId: dto.projectId,
                    parentId: safeParentId,
                    name: dto.name,
                    code,
                    startDate: start,
                    endDate: end,
                    contractorId: safeContractorId,
                    status: 'NOT_STARTED',
                    plannedWeight: safeWeight,
                },
            });
            console.log('Activity Created:', result);
            return result;
        } catch (error) {
            console.error('CREATE ERROR FULL DETAIL:', error);
            throw error;
        }
    }

    async findAllByProject(tenantId: string, projectId: string) {
        console.log('FIND ALL REQUEST (ignoring tenantId for debug):', {
            projectId
        });

        // Debug: Remove tenantId filter to see if we find ANYTHING for this project
        // return this.prisma.projectActivity.findMany({
        //    where: { tenantId, projectId },
        // ...

        // Debug query
        const count = await this.prisma.projectActivity.count({ where: { projectId } });
        console.log('DB COUNT for this query (No Tenant Filter):', count);

        // Fetch flat list, UI builds the tree
        const results = await this.prisma.projectActivity.findMany({
            where: { projectId }, // <--- REMOVED tenantId
            include: {
                contractor: true,
                dependencies: { include: { dependsOn: true } },
                progressRecords: { orderBy: { weekStartDate: 'desc' }, take: 1 },
                milestones: true // Include milestones for tree visualization
            },
            orderBy: { startDate: 'asc' },
        });

        console.log('Found results (No Tenant Filter):', results.length);

        // Calculate CPM
        return this.calculateCPM(results);
    }

    private calculateCPM(activities: any[]) {
        if (activities.length === 0) return [];

        // 1. Map to easier structure
        const nodes = new Map<string, {
            id: string;
            duration: number;
            es: number;
            ef: number;
            ls: number;
            lf: number;
            predecessors: string[];
            successors: string[];
            original: any;
        }>();

        activities.forEach(a => {
            const start = new Date(a.startDate).getTime();
            const end = new Date(a.endDate).getTime();
            const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)); // Days

            nodes.set(a.id, {
                id: a.id,
                duration: Math.max(1, duration), // Min 1 day
                es: 0, ef: 0, ls: Infinity, lf: Infinity,
                predecessors: a.dependencies.map((d: any) => d.dependsOnId),
                successors: [], // Will fill
                original: a
            });
        });

        // Fill successors
        nodes.forEach(node => {
            node.predecessors.forEach(predId => {
                const pred = nodes.get(predId);
                if (pred) pred.successors.push(node.id);
            });
        });

        // 2. Forward Pass (ES, EF)
        // Topological sort not strictly needed if we iterate until stable, but standard approach:
        // Or simpler: iterative updates. Since dag depth is finite.

        const sortedIds = this.topologicalSort(nodes);

        sortedIds.forEach(id => {
            const node = nodes.get(id)!;
            // ES = max(EF of predecessors)
            let maxPredEF = 0;
            node.predecessors.forEach(pId => {
                const p = nodes.get(pId);
                if (p && p.ef > maxPredEF) maxPredEF = p.ef;
            });
            node.es = maxPredEF;
            node.ef = node.es + node.duration;
        });

        const projectDuration = Math.max(...Array.from(nodes.values()).map(n => n.ef));

        // 3. Backward Pass (LF, LS)
        // Iterate reverse topological
        [...sortedIds].reverse().forEach(id => {
            const node = nodes.get(id)!;
            // LF = min(LS of successors)
            if (node.successors.length === 0) {
                node.lf = projectDuration;
            } else {
                let minSuccLS = Infinity;
                node.successors.forEach(sId => {
                    const s = nodes.get(sId);
                    if (s && s.ls < minSuccLS) minSuccLS = s.ls;
                });
                node.lf = minSuccLS;
            }
            node.ls = node.lf - node.duration;
        });

        // 4. Mark Critical (Float == 0)
        return Array.from(nodes.values()).map(n => {
            const float = n.ls - n.es;
            // Slack tolerance (e.g. < 0.1) due to float/math
            const isCritical = float < 0.5;
            return {
                ...n.original,
                cpm: {
                    es: n.es, ef: n.ef, ls: n.ls, lf: n.lf, float, isCritical
                },
                isCritical // Top level convenience
            };
        });
    }

    private topologicalSort(nodes: Map<string, any>) {
        const visited = new Set<string>();
        const stack: string[] = [];

        const visit = (id: string) => {
            if (visited.has(id)) return;
            visited.add(id);
            const node = nodes.get(id);
            if (node) {
                node.successors.forEach((sId: string) => visit(sId));
            }
            stack.push(id);
        };

        nodes.forEach((_, id) => {
            if (!visited.has(id)) {
                // But wait, standard dfs topo sort is for processing dependencies first.
                // My graph: predecessors -> successors.
                // So if I visit successors recursively, I push node AFTER successors. 
                // That gives reverse topological order.
                // So I need to reverse stack to get topological.
                visit(id);
            }
        });

        return stack.reverse();
    }

    async findOne(tenantId: string, id: string) {
        const activity = await this.prisma.projectActivity.findFirst({
            where: { id, tenantId },
            include: {
                dependencies: true,
                progressRecords: { orderBy: { weekStartDate: 'desc' } },
                closureRecord: true,
                milestones: true // Include linked milestones
            }
        });
        if (!activity) throw new NotFoundException('Activity not found');
        return activity;
    }

    async update(tenantId: string, id: string, dto: UpdateActivityDto) {
        const activity = await this.findOne(tenantId, id);

        // If progress update requested
        if (dto.percent !== undefined) {
            const inputPercent = Number(dto.percent);

            const today = new Date();
            // Create Midnight Date for "Start of Week" (Monday) to avoid time-based duplicates
            const day = today.getDay() || 7; // Get current day number, converting Sun (0) to 7
            if (day !== 1) today.setHours(-24 * (day - 1));
            else today.setHours(0, 0, 0, 0); // If today is Monday, just reset time

            // Actually, safer logic:
            const d = new Date();
            const dayOfWeek = d.getDay();
            const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust when day is sunday
            const weekStart = new Date(d.setDate(diff));
            weekStart.setHours(0, 0, 0, 0);

            // 1. Create/Update Weekly Record (Snapshot)
            await this.prisma.activityWeeklyProgress.upsert({
                where: {
                    activityId_weekStartDate: {
                        activityId: id,
                        weekStartDate: weekStart
                    }
                },
                update: {
                    percent: inputPercent, // Update snapshot to latest value
                    notes: dto.notes
                },
                create: {
                    tenantId,
                    projectId: activity.projectId,
                    activityId: id,
                    weekStartDate: weekStart,
                    percent: inputPercent,
                    notes: dto.notes
                }
            });

            // 2. Update Main Activity Status & Percent directly (User Input is Source of Truth)
            // We do NOT sum records anymore because users input "Cumulative Progress".
            const finalPercent = Math.min(100, Math.max(0, inputPercent)); // Clamp 0-100

            // Auto-update Status logic
            let newStatus = activity.status;
            if (finalPercent > 0 && finalPercent < 100 && activity.status === 'NOT_STARTED') {
                newStatus = 'IN_PROGRESS';
            } else if (finalPercent >= 100) {
                newStatus = 'DONE';
            }

            // 3. Update Main Activity
            await this.prisma.projectActivity.update({
                where: { id },
                data: {
                    status: newStatus,
                    percent: finalPercent
                }
            });

            // 4. Trigger Rollup if this activity has a parent
            if (activity.parentId) {
                await this.updateParentChain(tenantId, activity.parentId);
            }
        }

        return this.prisma.projectActivity.update({
            where: { id },
            data: {
                name: dto.name,
                startDate: dto.startDate ? new Date(dto.startDate) : undefined,
                endDate: dto.endDate ? new Date(dto.endDate) : undefined,
                status: dto.status,
                contractorId: dto.contractorId,
                budgetLineId: (dto as any).budgetLineId, // Temporary cast until DTO is updated
            },
        });
    }

    async addDependency(tenantId: string, activityId: string, dto: AddDependencyDto) {
        const activity = await this.findOne(tenantId, activityId);

        // Prevent self-dependency
        if (activityId === dto.dependsOnActivityId) throw new BadRequestException('Cannot depend on self');

        // Prevent duplicates
        const exists = await this.prisma.activityDependency.findFirst({
            where: { activityId, dependsOnId: dto.dependsOnActivityId }
        });
        if (exists) throw new ConflictException('Dependency already exists');

        return this.prisma.activityDependency.create({
            data: {
                tenantId,
                projectId: activity.projectId,
                activityId,
                dependsOnId: dto.dependsOnActivityId
            }
        });
    }

    async closeActivity(tenantId: string, activityId: string, dto: CloseActivityDto) {
        const activity = await this.prisma.projectActivity.findFirst({
            where: { id: activityId, tenantId },
            include: {
                dependencies: { include: { dependsOn: true } },
                children: true
            }
        });

        if (!activity) throw new NotFoundException('Activity not found');

        // 1. Validation: Progress must be 100%
        if (activity.percent < 100) {
            throw new BadRequestException('Activity must be 100% completed before closing.');
        }

        // 2. Validation: All dependencies must be DONE or CLOSED
        const pendingDeps = activity.dependencies.filter(d =>
            d.dependsOn.status !== 'DONE' && d.dependsOn.status !== 'CLOSED'
        );

        if (pendingDeps.length > 0) {
            const names = pendingDeps.map(d => d.dependsOn.name).join(', ');
            throw new BadRequestException(`Cannot close: Pending dependencies (${names})`);
        }

        // 3. Validation: If it has children, all must be DONE or CLOSED
        // (Optional strictness, but good for data integrity)
        const pendingChildren = activity.children.filter(c =>
            c.status !== 'DONE' && c.status !== 'CLOSED'
        );
        if (pendingChildren.length > 0) {
            throw new BadRequestException('Cannot close: All sub-activities must be completed first.');
        }

        // 4. Create Closure Record & Update Status
        return this.prisma.$transaction(async (tx) => {
            // Delete existing closure record if any (re-closing)
            await tx.activityClosureRecord.deleteMany({ where: { activityId } });

            const record = await tx.activityClosureRecord.create({
                data: {
                    tenantId,
                    projectId: activity.projectId,
                    activityId,
                    closureCode: `CL-${new Date().getTime()}`, // Simple unique code
                    closedAt: new Date(),
                    pmName: dto.pmName,
                    directorName: dto.directorName,
                    contractorName: dto.contractorName,
                }
            });

            await tx.projectActivity.update({
                where: { id: activityId },
                data: { status: 'CLOSED' }
            });

            return record;
        });
    }
    private async updateParentChain(tenantId: string, parentId: string) {
        // 1. Get all siblings (children of this parent)
        const children = await this.prisma.projectActivity.findMany({
            where: { parentId, tenantId },
            select: { startDate: true, endDate: true, percent: true, plannedWeight: true }
        });

        if (children.length === 0) return;

        // 2. Calculate aggregates
        let minStart = children[0].startDate;
        let maxEnd = children[0].endDate;
        let totalWeight = 0;
        let weightedProgress = 0;

        children.forEach(child => {
            if (child.startDate < minStart) minStart = child.startDate;
            if (child.endDate > maxEnd) maxEnd = child.endDate;

            const w = child.plannedWeight || 1;
            totalWeight += w;
            weightedProgress += (child.percent * w);
        });

        const newPercent = totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;

        // 3. Update Parent
        const parent = await this.prisma.projectActivity.update({
            where: { id: parentId },
            data: {
                startDate: minStart,
                endDate: maxEnd,
                percent: newPercent,
            }
        });

        // 4. Recurse if parent has a parent
        if (parent.parentId) {
            await this.updateParentChain(tenantId, parent.parentId);
        }
    }
}
