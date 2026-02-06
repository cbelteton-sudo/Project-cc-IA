import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ContractorsService } from './contractors.service';
import { CreateContractorDto, UpdateContractorDto } from './dto/create-contractor.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActiveUser } from '../../common/decorators/active-user.decorator';

@Controller('contractors')
@UseGuards(JwtAuthGuard)
export class ContractorsController {
    constructor(private readonly contractorsService: ContractorsService) { }

    @Post()
    create(@ActiveUser('tenantId') tenantId: string, @Body() createContractorDto: CreateContractorDto) {
        return this.contractorsService.create(tenantId, createContractorDto);
    }

    @Get()
    findAll(@ActiveUser('tenantId') tenantId: string) {
        return this.contractorsService.findAll(tenantId);
    }

    @Get(':id')
    findOne(@ActiveUser('tenantId') tenantId: string, @Param('id') id: string) {
        return this.contractorsService.findOne(tenantId, id);
    }

    @Patch(':id')
    update(@ActiveUser('tenantId') tenantId: string, @Param('id') id: string, @Body() updateContractorDto: UpdateContractorDto) {
        return this.contractorsService.update(tenantId, id, updateContractorDto);
    }

    @Delete(':id')
    remove(@ActiveUser('tenantId') tenantId: string, @Param('id') id: string) {
        return this.contractorsService.remove(tenantId, id);
    }

    // Assignments
    @Get(':id/projects')
    getAssignments(@ActiveUser('tenantId') tenantId: string, @Param('id') id: string) {
        return this.contractorsService.getAssignments(tenantId, id);
    }

    @Post(':id/projects')
    assignProject(
        @ActiveUser('tenantId') tenantId: string,
        @Param('id') id: string,
        @Body() body: { projectId: string; role?: string }
    ) {
        return this.contractorsService.assignProject(tenantId, id, body.projectId, body.role);
    }

    @Delete(':id/projects/:assignmentId')
    removeAssignment(@ActiveUser('tenantId') tenantId: string, @Param('assignmentId') assignmentId: string) {
        return this.contractorsService.removeAssignment(tenantId, assignmentId);
    }
}
