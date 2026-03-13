import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateProjectMaterialDto } from './dto/create-project-material.dto';
import { UpdateProjectMaterialDto } from './dto/update-project-material.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { ReceiveProjectMaterialDto } from './dto/receive-project-material.dto';

@Injectable()
export class ProjectMaterialsService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectMaterialDto: CreateProjectMaterialDto) {
    try {
      return await this.prisma.projectMaterial.create({
        data: createProjectMaterialDto,
        include: {
          material: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'Este material ya está agregado al catálogo de este proyecto.',
        );
      }
      throw error;
    }
  }

  async findAllByProject(projectId: string) {
    return this.prisma.projectMaterial.findMany({
      where: { projectId },
      include: {
        material: true,
      },
      orderBy: {
        material: {
          name: 'asc',
        },
      },
    });
  }

  async findOne(id: string) {
    const projectMaterial = await this.prisma.projectMaterial.findUnique({
      where: { id },
      include: {
        material: true,
      },
    });

    if (!projectMaterial) {
      throw new NotFoundException('Project Material not found');
    }

    return projectMaterial;
  }

  async update(id: string, updateProjectMaterialDto: UpdateProjectMaterialDto) {
    await this.findOne(id); // validate existence
    return this.prisma.projectMaterial.update({
      where: { id },
      data: updateProjectMaterialDto,
      include: {
        material: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // validate existence
    return this.prisma.projectMaterial.delete({
      where: { id },
    });
  }

  async receiveMaterial(
    id: string,
    receiveProjectMaterialDto: ReceiveProjectMaterialDto,
    userId?: string, // optional for audit/future use
  ) {
    const projectMaterial = await this.findOne(id); // validate existence

    // Use a transaction to ensure both stock update and ledger entry succeed
    return this.prisma.$transaction(async (tx) => {
      // 1. Update stock available
      const updatedMaterial = await tx.projectMaterial.update({
        where: { id },
        data: {
          stockAvailable: {
            increment: receiveProjectMaterialDto.quantity,
          },
        },
        include: {
          material: true,
        },
      });

      // 2. Add an entry to CostLedger
      const entryPrice =
        receiveProjectMaterialDto.price || projectMaterial.plannedPrice || 0;
      const amountOut = receiveProjectMaterialDto.quantity * entryPrice;

      await tx.costLedger.create({
        data: {
          projectId: projectMaterial.projectId,
          date: receiveProjectMaterialDto.date
            ? new Date(receiveProjectMaterialDto.date)
            : new Date(),
          costType: 'MATERIAL',
          entryType: 'INVENTORY_RECEIPT',
          amount: amountOut,
          referenceId: projectMaterial.id,
          userId: userId,
          description:
            `[QTY:${receiveProjectMaterialDto.quantity}] ` +
            (receiveProjectMaterialDto.notes ||
              `Ingreso de material manual: ${projectMaterial.material.name}`),
          documentUrl: receiveProjectMaterialDto.poDocumentUrl,
          documentNumber: receiveProjectMaterialDto.poNumber,
        },
      });

      return updatedMaterial;
    });
  }

  async getKardex(id: string) {
    const projectMaterial = await this.findOne(id);

    // Fetch Receipts
    const receipts = await this.prisma.costLedger.findMany({
      where: {
        projectId: projectMaterial.projectId,
        referenceId: id,
        costType: 'MATERIAL',
        entryType: 'INVENTORY_RECEIPT',
      },
      include: {
        user: true,
      },
      orderBy: { date: 'asc' },
    });

    // Fetch Consumptions
    const consumptions = await this.prisma.activityMaterial.findMany({
      where: {
        projectMaterialId: id,
      },
      include: {
        activity: true,
        reportedByUser: true,
      },
      orderBy: { dateConsumed: 'asc' },
    });

    // Merge and format
    const movements = [
      ...receipts.map((r) => {
        // Extract quantity from description if present, otherwise calculate it
        let qty = 0;
        let notes = r.description || '';
        const match = notes.match(/^\[QTY:([0-9.]+)\]\s(.*)/);

        if (match) {
          qty = parseFloat(match[1]);
          notes = match[2];
        } else {
          const price = projectMaterial.plannedPrice || 1;
          qty = r.amount / price;
        }

        return {
          id: r.id,
          date: r.date,
          type: 'IN',
          quantity: qty,
          amount: r.amount,
          reference: 'Ingreso Manual',
          notes: notes,
          documentUrl: r.documentUrl,
          documentNumber: r.documentNumber,
          user: r.user
            ? { id: r.user.id, name: r.user.name, email: r.user.email }
            : null,
        };
      }),
      ...consumptions.map((c) => {
        const price = projectMaterial.plannedPrice || 0;
        return {
          id: c.id,
          date: c.dateConsumed,
          type: 'OUT',
          quantity: c.quantityConsumed,
          amount: c.quantityConsumed * price,
          reference: `Consumo Tarea: ${c.activity?.name || 'Varios'}`,
          notes: c.notes,
          activity: c.activity
            ? { id: c.activity.id, name: c.activity.name }
            : null,
          user: c.reportedByUser
            ? {
                id: c.reportedByUser.id,
                name: c.reportedByUser.name,
                email: c.reportedByUser.email,
              }
            : null,
        };
      }),
    ];

    // Sort by date
    return movements.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  async getFinancialVarianceReport(projectId: string) {
    const projectMaterials = await this.prisma.projectMaterial.findMany({
      where: { projectId },
      include: {
        material: true,
      },
    });

    const ledgers = await this.prisma.costLedger.findMany({
      where: {
        projectId,
        costType: 'MATERIAL',
        entryType: 'INVENTORY_RECEIPT',
      },
    });

    const ledgerGroups = ledgers.reduce(
      (acc, ledger) => {
        const refId = ledger.referenceId;
        if (!refId) return acc;
        if (!acc[refId]) {
          acc[refId] = { totalAmount: 0, totalQty: 0 };
        }

        let qty = 0;
        let notes = ledger.description || '';
        const match = notes.match(/^\[QTY:([0-9.]+)\]/);
        if (match) {
          qty = parseFloat(match[1]);
        } else {
          const targetPM = projectMaterials.find((pm) => pm.id === refId);
          const price = targetPM?.plannedPrice || 1;
          qty = ledger.amount / price;
        }

        acc[refId].totalAmount += ledger.amount;
        acc[refId].totalQty += qty;

        return acc;
      },
      {} as Record<string, { totalAmount: number; totalQty: number }>,
    );

    const varianceReports = projectMaterials.map((pm) => {
      const ledgerData = ledgerGroups[pm.id];
      const wac =
        ledgerData && ledgerData.totalQty > 0
          ? ledgerData.totalAmount / ledgerData.totalQty
          : pm.plannedPrice;

      const qtyPurchased = pm.stockAvailable + pm.stockConsumed;
      const priceVariance = (pm.plannedPrice - wac) * qtyPurchased;
      const quantityVariance =
        (pm.plannedQty - pm.stockConsumed) * pm.plannedPrice;
      const totalVariance = priceVariance + quantityVariance;

      const benchmarkIndex =
        pm.material.costParam > 0 ? wac / pm.material.costParam : 1;

      const remainingQty = Math.max(0, pm.plannedQty - pm.stockConsumed);
      const eac = pm.stockConsumed * wac + remainingQty * wac;

      return {
        id: pm.id,
        materialName: pm.material.name,
        unit: pm.material.unit,
        plannedQty: pm.plannedQty,
        stockConsumed: pm.stockConsumed,
        qtyPurchased,
        plannedPrice: pm.plannedPrice,
        wac,
        marketCostParam: pm.material.costParam,
        priceVariance,
        quantityVariance,
        totalVariance,
        benchmarkIndex,
        eac,
        budgetAtCompletion: pm.plannedQty * pm.plannedPrice,
      };
    });

    return varianceReports.sort((a, b) => a.totalVariance - b.totalVariance);
  }

  async getStartupChecklist(projectId: string) {
    const projectMaterials = await this.prisma.projectMaterial.findMany({
      where: { projectId },
      include: {
        material: true,
      },
      orderBy: {
        material: {
          name: 'asc',
        },
      },
    });

    let completeCount = 0;

    const items = projectMaterials.map((pm) => {
      const isComplete = pm.stockAvailable >= pm.plannedQty;
      if (isComplete) completeCount++;
      return {
        id: pm.id,
        materialName: pm.material.name,
        unit: pm.material.unit,
        plannedQty: pm.plannedQty,
        stockAvailable: pm.stockAvailable,
        isComplete,
        progressPercentage:
          pm.plannedQty > 0
            ? Math.min(100, Math.round((pm.stockAvailable / pm.plannedQty) * 100))
            : (pm.stockAvailable >= 0 ? 100 : 0),
      };
    });

    return {
      totalItems: items.length,
      completeItems: completeCount,
      overallProgress: items.length > 0 ? Math.round((completeCount / items.length) * 100) : 100,
      items,
    };
  }
}
