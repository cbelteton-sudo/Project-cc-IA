import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { LedgerService } from '../budgets/ledger.service';

@Injectable()
export class PurchaseOrdersService {
  private readonly logger = new Logger(PurchaseOrdersService.name);

  constructor(
    private prisma: PrismaService,
    private ledger: LedgerService,
  ) { }

  async create(createDto: CreatePurchaseOrderDto, tenantId: string) {
    // Validate project
    const project = await this.prisma.project.findUnique({
      where: { id: createDto.projectId },
    });
    if (!project || project.tenantId !== tenantId) {
      throw new BadRequestException('Invalid Project');
    }

    // Calculate total
    const total = createDto.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    // Transaction: Create PO -> Add Ledger Entries
    const po = await this.prisma.$transaction(async (tx) => {
      // 1. Create PO
      const newPo = await tx.purchaseOrder.create({
        data: {
          projectId: createDto.projectId,
          vendor: createDto.vendor,
          total,
          status: 'ISSUED', // Sent directly to Issued for MVP simplicity
          docStatus: 'APPROVED',
          date: new Date(),
          items: {
            create: createDto.items.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.quantity * item.unitPrice,
              budgetLineId: item.budgetLineId,
            })),
          },
        },
        include: { items: true },
      });

      // 2. Create Ledger Entries (Commitments)
      // We need to do this outside the transaction or pass tx to ledger service?
      // LedgerService uses this.prisma. If we want transactional integrity, we should refactor LedgerService to accept tx.
      // For now, we will do it after or assume eventual consistency is acceptable for MVP prototypes, 
      // OR better: Just manually create Ledger entries here using `tx` to match the pattern.
      // But `LedgerService` logic is reusable.
      // Let's use `tx.costLedger.create` here directly to be safe.

      for (const item of createDto.items) {
        if (item.budgetLineId) {
          // Need to fetch budget line to get CostType
          const line = await tx.budgetLine.findUnique({ where: { id: item.budgetLineId } });

          if (line) {
            const itemTotal = item.quantity * item.unitPrice;
            await tx.costLedger.create({
              data: {
                projectId: createDto.projectId,
                wbsActivityId: line.wbsActivityId,
                costType: line.costType,
                entryType: 'PO_COMMIT',
                amount: itemTotal,
                referenceId: newPo.id,
                description: `PO #${newPo.id.substring(0, 8)} - ${item.description}`,
                date: new Date(),
              }
            });
          }
        }
      }

      return newPo;
    });

    return po;
  }

  async findAll(tenantId: string, projectId?: string) {
    const where: any = { project: { tenantId } };
    if (projectId) where.projectId = projectId;

    return this.prisma.purchaseOrder.findMany({
      where,
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true, project: true },
    });

    if (!po || po.project.tenantId !== tenantId) throw new NotFoundException('PO not found');
    return po;
  }

  async update(id: string, updateDto: UpdatePurchaseOrderDto, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: updateDto as any,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.purchaseOrder.delete({ where: { id } });
  }
}
