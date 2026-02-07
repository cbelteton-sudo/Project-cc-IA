import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import PDFDocument from 'pdfkit';

@Injectable()
export class DailyLogService {
    constructor(private prisma: PrismaService) { }

    async getDailyLog(projectId: string, dateStr: string) {
        const start = new Date(dateStr);
        const end = new Date(dateStr);
        end.setHours(23, 59, 59, 999);

        const updates = await this.prisma.fieldUpdate.findMany({
            where: {
                projectId,
                date: { gte: start, lte: end }
            },
            include: { items: { include: { activity: true } }, photos: true }
        });

        const issues = await this.prisma.issue.findMany({
            where: {
                projectId,
                createdAt: { gte: start, lte: end }
            },
            include: { activity: true }
        });

        return { updates, issues };
    }

    async generatePdf(projectId: string, dateStr: string): Promise<Buffer> {
        const { updates, issues } = await this.getDailyLog(projectId, dateStr);
        const project = await this.prisma.project.findUnique({ where: { id: projectId } });

        return new Promise((resolve) => {
            const doc = new PDFDocument({ margin: 50 });
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // HEADER
            doc.fontSize(20).text('Daily Site Log', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Project: ${project?.name || 'Loading...'}`);
            doc.text(`Date: ${dateStr}`);
            doc.moveDown();

            // UPDATES SECTION
            doc.fontSize(16).text('Activity Updates', { underline: true });
            doc.moveDown();

            if (updates.length === 0) {
                doc.fontSize(12).text('No updates recorded for today.');
            } else {
                updates.forEach(update => {
                    update.items.forEach(item => {
                        doc.fontSize(12).font('Helvetica-Bold').text(item.activity.name);
                        doc.font('Helvetica')
                            .text(`Progress: ${item.manualPercent ?? item.suggestedPercent}% (Confidence: ${item.confidenceScore ?? 'N/A'})`);
                        if (item.notes) doc.text(`Notes: ${item.notes}`);
                        if (item.isRisk) doc.fillColor('red').text('Status: AT RISK').fillColor('black');
                        doc.moveDown(0.5);
                    });
                });
            }
            doc.moveDown();

            // ISSUES SECTION
            doc.fontSize(16).text('Issues Raised', { underline: true });
            doc.moveDown();

            if (issues.length === 0) {
                doc.fontSize(12).text('No new issues raised today.');
            } else {
                issues.forEach(issue => {
                    doc.fontSize(12).font('Helvetica-Bold').text(issue.title);
                    doc.font('Helvetica').text(`Severity: ${issue.severity} | Status: ${issue.status}`);
                    if (issue.activity) doc.text(`Related Activity: ${issue.activity.name}`);
                    doc.text(`Description: ${issue.description || 'N/A'}`);
                    doc.moveDown(0.5);
                });
            }

            doc.end();
        });
    }
}
