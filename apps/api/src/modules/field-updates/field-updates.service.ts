import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFieldUpdateDto, UpdateItemDto } from './dto/create-field-update.dto';

@Injectable()
export class FieldUpdatesService {
    private readonly logger = new Logger(FieldUpdatesService.name);

    constructor(private prisma: PrismaService) { }

    async createDraft(dto: CreateFieldUpdateDto) {
        const { projectId, date, items } = dto;
        const dateObj = new Date(date);

        // 1. Find or Create FieldUpdate for this date/project (Draft mode)
        // In a real offline-first scenario, we might receive an ID from client, but strictly following schema defaults:
        let fieldUpdate = await this.prisma.fieldUpdate.findFirst({
            where: { projectId, date: dateObj, status: 'DRAFT' } // Conflict resolution: simple draft merging
        });

        if (!fieldUpdate) {
            fieldUpdate = await this.prisma.fieldUpdate.create({
                data: {
                    projectId,
                    date: dateObj,
                    status: "DRAFT",
                    createdBy: "SYSTEM_OFFLINE", // Should come from request user context
                }
            });
        }

        // 2. Process Items
        const results = [];
        for (const item of items) {
            const result = await this.processItem(fieldUpdate.id, item);
            results.push(result);
        }

        return { fieldUpdate, items: results };
    }

    async updateStatus(id: string, status: string) {
        return this.prisma.fieldUpdate.update({
            where: { id },
            data: {
                status,
                submittedAt: status === 'SUBMITTED' ? new Date() : undefined
            }
        });
    }

    async getTodayStats(projectId: string) {
        // Placeholder for dashboard stats
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        return this.prisma.fieldUpdate.findMany({
            where: { projectId, date: { gte: startOfDay } },
            include: { items: true }
        });
    }

    // --- CORE LOGIC ---

    private async processItem(fieldUpdateId: string, dto: UpdateItemDto) {
        const activity = await this.prisma.projectActivity.findUnique({
            where: { id: dto.activityId },
            include: { measurementTemplate: { include: { items: true } } }
        });

        if (!activity) throw new Error(`Activity ${dto.activityId} not found`);

        // 1. Calculate Suggested Percent
        const suggestedPercent = await this.calculateSuggestedPercent(activity, dto);

        // 2. Calculate Confidence Score
        const confidenceScore = await this.calculateConfidenceScore(activity, dto, suggestedPercent, fieldUpdateId);

        // 3. Determine if review is required
        let requiresReview = false;

        // Override Rule: if abs(final - suggested) > 10 => overrideJustification required (enforced by UI validation usually, here we flag review)
        if (dto.manualPercent !== undefined && Math.abs(dto.manualPercent - suggestedPercent) > 20) {
            requiresReview = true;
        }

        // Confidence consistency rule
        if (confidenceScore < 40) { // Baja confianza
            requiresReview = true;
        }

        // Upsert Item
        // Check if item already exists in this update
        const existingItem = await this.prisma.fieldUpdateItem.findFirst({
            where: { fieldUpdateId, activityId: dto.activityId }
        });

        const data = {
            qtyDone: dto.qtyDone,
            checklistState: dto.checklistState,
            milestoneState: dto.milestoneState,
            manualPercent: dto.manualPercent,
            notes: dto.notes,
            isRisk: dto.isRisk,
            overrideJustification: dto.overrideJustification,
            suggestedPercent,
            confidenceScore,
            requiresReview
        };

        if (existingItem) {
            return this.prisma.fieldUpdateItem.update({
                where: { id: existingItem.id },
                data
            });
        } else {
            return this.prisma.fieldUpdateItem.create({
                data: {
                    fieldUpdateId,
                    activityId: dto.activityId,
                    ...data
                }
            });
        }
    }

    private async calculateSuggestedPercent(activity: any, dto: UpdateItemDto): Promise<number> {
        const type = activity.measurementType;

        if (type === 'QUANTITY') {
            if (!activity.totalQty || activity.totalQty === 0) return 0;

            // Get historical SUM(qtyDone) from APPROVED updates only? Or submitted?
            // Prompt: "sum(qtyDone) histórico (approved/submitted) + draft actual"
            const aggregations = await this.prisma.fieldUpdateItem.aggregate({
                _sum: { qtyDone: true },
                where: {
                    activityId: activity.id,
                    fieldUpdate: { status: { in: ['SUBMITTED', 'APPROVED'] } }
                }
            });

            const historicalQty = aggregations._sum.qtyDone || 0;
            const currentQty = dto.qtyDone || 0;
            const totalQty = activity.totalQty;

            const percent = ((historicalQty + currentQty) / totalQty) * 100;
            return this.clamp(Math.round(percent), 0, 100);
        }

        if (type === 'CHECKLIST' || type === 'MILESTONE') {
            // Parse state JSON string to object
            const state = dto.checklistState ? JSON.parse(dto.checklistState) :
                dto.milestoneState ? JSON.parse(dto.milestoneState) : {};

            if (!activity.measurementTemplate) return 0;

            let totalWeight = 0;
            let earnedWeight = 0;

            for (const item of activity.measurementTemplate.items) {
                totalWeight += item.weight;
                if (state[item.id]) {
                    earnedWeight += item.weight;
                }
            }

            // Normalizing just in case weights don't sum 100 exactly, though they should
            if (totalWeight === 0) return 0;
            return this.clamp(Math.round((earnedWeight / totalWeight) * 100), 0, 100);
        }

        if (type === 'TIME_ESTIMATE') {
            const start = new Date(activity.startDate).getTime();
            const end = new Date(activity.endDate).getTime();
            const now = new Date().getTime();
            const totalDuration = end - start;

            if (totalDuration <= 0) return 100; // Should be handled

            const elapsed = now - start;
            const percent = (elapsed / totalDuration) * 100;
            return this.clamp(Math.round(percent), 0, 100);
        }

        return 0;
    }

    private async calculateConfidenceScore(
        activity: any,
        dto: UpdateItemDto,
        suggestedPercent: number,
        fieldUpdateId: string
    ): Promise<number> {
        let score = 0;
        const type = activity.measurementType;

        // Base Score
        if (type === 'QUANTITY') {
            if (activity.totalQty > 0 && dto.qtyDone !== undefined) score += 50;
        } else if (type === 'CHECKLIST' || type === 'MILESTONE') {
            // +50 if >=1 item marked
            const state = dto.checklistState ? JSON.parse(dto.checklistState) :
                dto.milestoneState ? JSON.parse(dto.milestoneState) : {};
            if (Object.values(state).some(v => v === true)) score += 50;
        } else if (type === 'TIME_ESTIMATE') {
            score += 20;
        }

        // Evidence: Photos (Count from DB for this update/activity)
        // Note: In draft/offline mode, photos might be uploaded async. 
        // Assuming Photos are already linked or we count what's available.
        // For this step, we'll query DB.
        const photoCount = await this.prisma.photo.count({
            where: {
                fieldUpdateId,
                activityId: activity.id
            }
        });

        if (photoCount >= 2) score += 20;
        else if (photoCount === 1) score += 10;

        // Evidence: Notes
        if (dto.notes && dto.notes.length >= 20) score += 10;

        // Penalties
        if (dto.isRisk && (!dto.notes || dto.notes.length === 0)) score -= 20;

        // Consistencia: Delta from last
        const lastUpdate = await this.prisma.fieldUpdateItem.findFirst({
            where: {
                activityId: activity.id,
                fieldUpdate: { status: { in: ['SUBMITTED', 'APPROVED'] } }
            },
            orderBy: { fieldUpdate: { date: 'desc' } }
        });

        const lastPercent = lastUpdate?.manualPercent || lastUpdate?.suggestedPercent || 0;
        const currentPercent = dto.manualPercent !== undefined ? dto.manualPercent : suggestedPercent;
        const delta = currentPercent - lastPercent;

        if (delta > 35) {
            if (photoCount >= 3) score -= 10;
            else score -= 25;
            // Side effect: requiresReview is handled in main flow, but score penalty applies here
        }

        // Consistencia: Quantity Overflow
        if (type === 'QUANTITY' && activity.totalQty > 0) {
            const aggregations = await this.prisma.fieldUpdateItem.aggregate({
                _sum: { qtyDone: true },
                where: {
                    activityId: activity.id,
                    fieldUpdateId: { not: fieldUpdateId }, // Exclude current draft to avoid double counting if re-running
                    fieldUpdate: { status: { in: ['SUBMITTED', 'APPROVED'] } }
                }
            });
            const historical = aggregations._sum?.qtyDone || 0;
            const current = dto.qtyDone || 0;
            if ((historical + current) > (activity.totalQty * 1.05)) {
                score -= 20;
            }
        }

        return this.clamp(score, 0, 100);
    }

    private clamp(num: number, min: number, max: number) {
        return Math.min(Math.max(num, min), max);
    }
}
