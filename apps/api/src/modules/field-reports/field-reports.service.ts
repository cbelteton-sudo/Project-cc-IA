import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { format } from 'date-fns';

@Injectable()
export class FieldReportsService {
    constructor(private prisma: PrismaService) { }

    async getTodayReport(projectId: string, userId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Try to find existing report
        let report = await this.prisma.fieldDailyReport.findUnique({
            where: {
                projectId_date: {
                    projectId,
                    date: today,
                },
            },
            include: {
                entries: {
                    include: {
                        photos: true,
                    },
                },
            },
        });

        // 2. Create if not exists
        if (!report) {
            report = await this.prisma.fieldDailyReport.create({
                data: {
                    projectId,
                    date: today,
                    createdBy: userId,
                    status: 'DRAFT',
                },
                include: {
                    entries: {
                        include: {
                            photos: true,
                        },
                    },
                },
            });
        }

        return report;
    }

    async upsertEntry(dto: any) {
        // Determine status based on input or logic
        const { dailyReportId, scheduleActivityId, activityName, status, progressChip, note, wbs } = dto;

        // Check if entry exists for this activity in this report
        const existingEntry = await this.prisma.fieldDailyEntry.findFirst({
            where: {
                dailyReportId,
                scheduleActivityId
            }
        });

        if (existingEntry) {
            return this.prisma.fieldDailyEntry.update({
                where: { id: existingEntry.id },
                data: {
                    status,
                    progressChip,
                    note,
                    updatedAt: new Date()
                }
            });
        }

        return this.prisma.fieldDailyEntry.create({
            data: {
                dailyReportId,
                scheduleActivityId,
                activityName,
                wbs,
                status,
                progressChip,
                note,
            },
        });
    }

    async submitReport(id: string, userId: string) {
        return this.prisma.fieldDailyReport.update({
            where: { id },
            data: {
                status: 'SUBMITTED',
                submittedAt: new Date(),
            }
        });
    }

    async generatePdf(reportId: string) {
        // Mock PDF generation logic
        // In a real app, use 'pdfkit' or similar to generate a stream
        return {
            url: `http://localhost:4180/api/reports/${reportId}.pdf`, // Mock URL
            generatedAt: new Date()
        };
    }
}
