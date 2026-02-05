import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateActivityDto, UpdateActivityDto, AddDependencyDto } from './dto/create-activity.dto';

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
        return results;
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
            const weekStart = new Date(today.setDate(today.getDate() - today.getDay() + 1)); // Monday

            // 1. Create/Update Weekly Record (This week's snapshot)
            await this.prisma.activityWeeklyProgress.upsert({
                where: {
                    activityId_weekStartDate: {
                        activityId: id,
                        weekStartDate: weekStart
                    }
                },
                update: {
                    percent: inputPercent,
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

            // 2. Calculate TOTAL Cumulative Progress (Sum of all weekly records)
            // We need to fetch all records again to be sure (limit could have been applied in findOne)
            // Actually, findOne sorted by desc.
            // Let's rely on DB aggregation for accuracy
            const aggregation = await this.prisma.activityWeeklyProgress.aggregate({
                where: { activityId: id },
                _sum: { percent: true }
            });

            const totalPercent = aggregation._sum.percent || 0;

            // Auto-update Status logic based on TOTAL
            let newStatus = activity.status;
            if (totalPercent > 0 && totalPercent < 100 && activity.status === 'NOT_STARTED') {
                newStatus = 'IN_PROGRESS';
            } else if (totalPercent >= 100) {
                newStatus = 'DONE';
            }

            // 3. Update Main Activity Status & Percent
            await this.prisma.projectActivity.update({
                where: { id },
                data: {
                    status: newStatus,
                    percent: totalPercent // Update the cached total progress
                }
            });

            // Since we can't update `percent` if it doesn't exist, we must rely on the frontend or a computed field.
            // But `findAllByProject` is standard Prisma.
            // Let's look at schema 
        }

        return this.prisma.projectActivity.update({
            where: { id },
            data: {
                name: dto.name,
                startDate: dto.startDate ? new Date(dto.startDate) : undefined,
                endDate: dto.endDate ? new Date(dto.endDate) : undefined,
                status: dto.status,
                contractorId: dto.contractorId,
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
}
