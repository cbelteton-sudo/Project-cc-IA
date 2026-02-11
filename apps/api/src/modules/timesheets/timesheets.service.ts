import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LedgerService } from '../budgets/ledger.service';
import { CreateTimesheetDto } from './dto/create-timesheet.dto';

@Injectable()
export class TimesheetsService {
    constructor(
        private prisma: PrismaService,
        private ledger: LedgerService
    ) { }

    async create(dto: CreateTimesheetDto) {
        const { entries, ...data } = dto;

        return this.prisma.timesheet.create({
            data: {
                ...data,
                weekStartDate: new Date(data.weekStartDate),
                status: 'DRAFT',
                entries: {
                    create: entries?.map(e => ({
                        date: new Date(e.date),
                        wbsActivityId: e.wbsActivityId,
                        hours: e.hours || 0
                    }))
                }
            },
            include: { entries: true }
        });
    }

    async findAllByProject(projectId: string) {
        return this.prisma.timesheet.findMany({
            where: { projectId },
            include: {
                entries: {
                    include: { wbsActivity: true }
                },
                user: true
            },
            orderBy: { weekStartDate: 'desc' }
        });
    }

    async findOne(id: string) {
        const timesheet = await this.prisma.timesheet.findUnique({
            where: { id },
            include: { entries: true }
        });
        if (!timesheet) throw new NotFoundException('Timesheet not found');
        return timesheet;
    }

    async upsertEntry(timesheetId: string, entryData: { date: string, wbsActivityId: string, hours: number }) {
        // Find if entry exists for this day/activity
        const existing = await this.prisma.timesheetEntry.findFirst({
            where: {
                timesheetId,
                date: new Date(entryData.date)
                // Note: We removed wbsActivityId from unique check because a worker usually has one entry per day or we want to overwrite.
                // If we want multiple entries per day per worker (different activities), we need to check wbsActivityId too.
                // Current frontend logic sends one update per cell (Sheet+Date).
            }
        });

        let entry;
        if (existing) {
            entry = await this.prisma.timesheetEntry.update({
                where: { id: existing.id },
                data: {
                    hours: Number(entryData.hours),
                    wbsActivityId: entryData.wbsActivityId
                }
            });
        } else {
            entry = await this.prisma.timesheetEntry.create({
                data: {
                    timesheetId,
                    date: new Date(entryData.date),
                    wbsActivityId: entryData.wbsActivityId,
                    hours: Number(entryData.hours)
                }
            });
        }

        // 2. Record in Cost Ledger
        const timesheet = await this.prisma.timesheet.findUnique({ where: { id: timesheetId } });

        if (timesheet && entryData.wbsActivityId && Number(entryData.hours) > 0) {
            // Mock Hourly Rate for MVP (e.g., $150/hr blended rate)
            const HOURLY_RATE = 150;
            const totalCost = Number(entryData.hours) * HOURLY_RATE;

            // Cleanup old ledger entry for this timesheet entry to avoid double counting on updates
            // We use referenceId to link back to the timesheet entry
            await this.prisma.costLedger.deleteMany({
                where: {
                    referenceId: entry.id,
                    entryType: 'LABOR_ACTUAL'
                }
            });

            if (timesheet && entryData.wbsActivityId && Number(entryData.hours) > 0) {
                // Mock Hourly Rate for MVP (e.g., $150/hr blended rate)
                const HOURLY_RATE = 150;
                const totalCost = Number(entryData.hours) * HOURLY_RATE;

                // Determine Cost Type from Budget Line
                // We need to find the budget line associated with this activity for this project
                const budgetLine = await this.prisma.budgetLine.findFirst({
                    where: {
                        budget: { projectId: timesheet.projectId },
                        wbsActivityId: entryData.wbsActivityId
                    }
                });

                // Default to LABOR if no specific line found, or use the line's cost type
                const targetCostType = budgetLine ? budgetLine.costType : 'LABOR';

                // Cleanup old ledger entry for this timesheet entry to avoid double counting on updates
                // We use referenceId to link back to the timesheet entry
                await this.prisma.costLedger.deleteMany({
                    where: {
                        referenceId: entry.id,
                        entryType: 'LABOR_ACTUAL'
                    }
                });

                await this.ledger.addEntry({
                    projectId: timesheet.projectId,
                    wbsActivityId: entryData.wbsActivityId,
                    costType: targetCostType,
                    entryType: 'LABOR_ACTUAL',
                    amount: totalCost,
                    referenceId: entry.id,
                    description: `Mano de Obra: ${entryData.hours}hrs @ $${HOURLY_RATE}/hr`,
                    date: new Date(entryData.date)
                });
            } else if (Number(entryData.hours) === 0) {
                // If hours are 0, remove the ledger entry
                await this.prisma.costLedger.deleteMany({
                    where: {
                        referenceId: entry.id,
                        entryType: 'LABOR_ACTUAL'
                    }
                });
            }

            return entry;
        }
    }
}
