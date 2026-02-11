import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { LedgerService } from '../budgets/ledger.service';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private ledger: LedgerService,
  ) { }

  async create(createDto: CreateInvoiceDto, tenantId: string) {
    // ... existing create logic ...
    const project = await this.prisma.project.findUnique({
      where: { id: createDto.projectId }
    });
    if (!project || project.tenantId !== tenantId) throw new NotFoundException('Project not found');

    let ocrData = null;
    if (createDto.fileUrl) {
      ocrData = JSON.stringify({
        detectedVendor: createDto.vendor,
        detectedTotal: createDto.total,
        confidence: 0.98,
        items: [
          { description: 'Service Item 1', amount: createDto.total * 0.4 },
          { description: 'Service Item 2', amount: createDto.total * 0.6 }
        ]
      });
    }

    return this.prisma.invoice.create({
      data: {
        projectId: createDto.projectId,
        vendor: createDto.vendor,
        invoiceNumber: createDto.invoiceNumber,
        total: createDto.total,
        currency: createDto.currency || 'USD',
        date: new Date(createDto.date),
        fileUrl: createDto.fileUrl,
        ocrData: ocrData,
        status: 'PENDING',
      },
    });
  }

  // ... findAll, findOne ... 

  async findAll(tenantId: string, projectId?: string) {
    const where: any = { project: { tenantId } };
    if (projectId) where.projectId = projectId;

    return this.prisma.invoice.findMany({
      where,
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const inv = await this.prisma.invoice.findUnique({
      where: { id },
      include: { project: true, allocations: { include: { budgetLine: true } } }, // Include budgetLine for ledger
    });
    if (!inv || inv.project.tenantId !== tenantId) throw new NotFoundException('Invoice not found');
    return inv;
  }

  async update(id: string, updateDto: UpdateInvoiceDto, tenantId: string) {
    const existing = await this.findOne(id, tenantId);

    const data: any = { ...updateDto };
    if (updateDto.date) data.date = new Date(updateDto.date);

    // Ledger Logic: If status changes to POSTED (or APPROVED)
    if (data.status && (data.status === 'POSTED' || data.status === 'APPROVED') && existing.status !== 'POSTED' && existing.status !== 'APPROVED') {
      const invoice = await this.prisma.invoice.update({
        where: { id },
        data,
        include: { allocations: { include: { budgetLine: true } } }
      });

      // 1. Post Actuals
      for (const allocation of invoice.allocations) {
        if (allocation.budgetLine) {
          await this.ledger.addEntry({
            projectId: invoice.projectId,
            wbsActivityId: allocation.budgetLine.wbsActivityId,
            costType: allocation.budgetLine.costType,
            entryType: 'INVOICE_ACTUAL',
            amount: allocation.amount,
            referenceId: invoice.id,
            description: `Invoice #${invoice.invoiceNumber} - Alloc`,
            date: invoice.date,
          });
        }
      }

      // 2. Release PO Commitment if linked
      if (invoice.purchaseOrderId) {
        // How much to release? 
        // If allocations cover the full amount, release sum of allocations.
        // If allocations are missing, maybe release total?
        // Let's rely on allocations sum.
        const totalAllocated = invoice.allocations.reduce((sum, a) => sum + a.amount, 0);

        // We need to know which BudgetLines were committed in the PO.
        // But we can just use the Allocation BudgetLines, assuming they match the PO Lines.
        // If user allocated to different lines, it's a variance/transfer implicitly.
        // For MVP, we release from the SAME lines we post actuals to.

        for (const allocation of invoice.allocations) {
          if (allocation.budgetLine) {
            await this.ledger.addEntry({
              projectId: invoice.projectId,
              wbsActivityId: allocation.budgetLine.wbsActivityId,
              costType: allocation.budgetLine.costType,
              entryType: 'PO_RELEASE',
              amount: -allocation.amount, // Negative to reduce commitment
              referenceId: invoice.id,
              description: `Release PO for Inv #${invoice.invoiceNumber}`,
              date: invoice.date,
            });
          }
        }
      }

      return invoice;
    }

    return this.prisma.invoice.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.invoice.delete({ where: { id } });
  }
}
