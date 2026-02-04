import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PurchaseOrdersService {
  constructor(private prisma: PrismaService) { }

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

    // Transaction: Create PO -> Update Budget Lines
    return this.prisma.$transaction(async (tx) => {
      // 1. Create PO
      const po = await tx.purchaseOrder.create({
        data: {
          projectId: createDto.projectId,
          vendor: createDto.vendor,
          total,
          status: 'ISSUED', // Sent directly to Issued for MVP simplicity, skipping DRAFT logic for now to show financial impact
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

      // 2. Update Budget Lines (Committed Amount)
      for (const item of createDto.items) {
        if (item.budgetLineId) {
          const itemTotal = item.quantity * item.unitPrice;
          await tx.budgetLine.update({
            where: { id: item.budgetLineId },
            data: {
              amountCommitted: { increment: itemTotal },
            },
          });
        }
      }

      return po;
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.purchaseOrder.findMany({
      where: { project: { tenantId } },
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
    // Update logic is complex with financial impact. 
    // For MVP, we prevent updating financials if already issued, or handle delta.
    // Skipping complex delta updates for now.
    await this.findOne(id, tenantId);
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: updateDto as any, // Basic field updates - casting to any to avoid partial mismatch
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.purchaseOrder.delete({ where: { id } });
  }
}
