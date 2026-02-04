import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { MaterialRequestsService } from './material-requests.service';
import { PrismaService as DirectPrismaService } from '../../prisma/prisma.service';

@Controller('whatsapp')
export class WhatsappController {
    constructor(
        private readonly materialRequestsService: MaterialRequestsService,
        private readonly prisma: DirectPrismaService
    ) { }

    @Post('webhook')
    async handleIncomingMessage(@Body() body: { text: string; sender: string; projectId?: string }) {
        console.log('WhatsApp Webhook received:', body);

        // 1. Identify Project
        let projectId = body.projectId;
        let projectCode = '';

        if (!projectId) {
            // Try to find project code in text (e.g., "PRJ-001")
            const codeMatch = body.text.match(/(PRJ-\d+)/i);
            if (codeMatch) {
                projectCode = codeMatch[0];
                const project = await this.prisma.project.findFirst({
                    where: { code: projectCode }
                });
                if (project) projectId = project.id;
            }
        }

        if (!projectId) {
            // Fallback: Use the first active project for demo purposes
            const defaultProject = await this.prisma.project.findFirst();
            if (defaultProject) {
                projectId = defaultProject.id;
                projectCode = defaultProject.code || 'DEFAULT';
            } else {
                throw new BadRequestException("No project found to associate request with.");
            }
        }

        // 2. Parse Items (Simple Heuristic for Demo)
        const items = [
            {
                description: body.text,
                quantity: 1,
                unit: 'Lot'
            }
        ];

        // 3. Create Material Request
        const project = await this.prisma.project.findUnique({ where: { id: projectId } });
        let createdRequest;

        if (project) {
            createdRequest = await (this.prisma as any).materialRequest.create({
                data: {
                    projectId: projectId,
                    title: `WhatsApp Req from ${body.sender}`,
                    items: JSON.stringify(items),
                    status: 'DRAFT',
                },
            });
        }

        return {
            status: 'success',
            message: `Created Request for Project ${projectCode}`,
            ticketId: createdRequest?.id
        };
    }
}
