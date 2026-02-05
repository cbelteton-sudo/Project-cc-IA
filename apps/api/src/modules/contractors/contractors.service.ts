import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/create-contractor.dto';

@Injectable()
export class ContractorsService {
    constructor(private prisma: PrismaService) { }

    async create(tenantId: string, dto: CreateContractorDto) {
        return this.prisma.contractor.create({
            data: {
                ...dto,
                tenantId,
            },
        });
    }

    async findAll(tenantId: string) {
        return this.prisma.contractor.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(tenantId: string, id: string) {
        const contractor = await this.prisma.contractor.findFirst({
            where: { id, tenantId },
        });

        if (!contractor) {
            throw new NotFoundException(`Contractor not found`);
        }

        return contractor;
    }

    async update(tenantId: string, id: string, dto: UpdateContractorDto) {
        await this.findOne(tenantId, id); // Validate existence
        return this.prisma.contractor.update({
            where: { id },
            data: dto,
        });
    }

    async remove(tenantId: string, id: string) {
        await this.findOne(tenantId, id); // Validate existence
        return this.prisma.contractor.delete({
            where: { id },
        });
    }
}
