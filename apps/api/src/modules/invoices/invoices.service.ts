import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) { }

  async create(createDto: CreateInvoiceDto, tenantId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: createDto.projectId }
    });
    if (!project || project.tenantId !== tenantId) throw new NotFoundException('Project not found');

    // MOCK OCR LOGIC
    let ocrData = null;
    if (createDto.fileUrl) {
      // Simulate extracting data from "file"
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

  async findAll(tenantId: string) {
    return this.prisma.invoice.findMany({
      where: { project: { tenantId } },
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const inv = await this.prisma.invoice.findUnique({
      where: { id },
      include: { project: true, allocations: true },
    });
    if (!inv || inv.project.tenantId !== tenantId) throw new NotFoundException('Invoice not found');
    return inv;
  }

  async update(id: string, updateDto: UpdateInvoiceDto, tenantId: string) {
    await this.findOne(id, tenantId);

    const data: any = { ...updateDto };
    if (updateDto.date) data.date = new Date(updateDto.date);

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
