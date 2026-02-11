import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LedgerService {
    private readonly logger = new Logger(LedgerService.name);

    constructor(private prisma: PrismaService) { }

    async addEntry(data: {
        projectId: string;
        wbsActivityId?: string | null;
        costType: string;
        entryType: string;
        amount: number;
        referenceId?: string;
        description?: string;
        date?: Date;
    }) {
        return this.prisma.costLedger.create({
            data: {
                projectId: data.projectId,
                wbsActivityId: data.wbsActivityId,
                costType: data.costType,
                entryType: data.entryType,
                amount: data.amount,
                referenceId: data.referenceId,
                description: data.description,
                date: data.date || new Date(),
            },
        });
    }

    async getAggregatedCosts(projectId: string, wbsActivityId: string, costType: string) {
        const entries = await this.prisma.costLedger.findMany({
            where: {
                projectId,
                wbsActivityId,
                costType,
            },
        });

        let committed = 0;
        let actual = 0;

        for (const entry of entries) {
            if (['PO_COMMIT', 'PO_RELEASE'].includes(entry.entryType)) {
                committed += entry.amount;
            }
            if (['INVOICE_ACTUAL', 'LABOR_ACTUAL', 'EXPENSE_ACTUAL', 'ADJUSTMENT'].includes(entry.entryType)) {
                actual += entry.amount;
            }
        }

        return { committed, actual };
    }
}
