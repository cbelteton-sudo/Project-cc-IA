import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ContractorsService } from './contractors.service';
import {
  CreateContractorDto,
  UpdateContractorDto,
} from './dto/create-contractor.dto';
import {
  CreateContractorResourceDto,
  UpdateContractorResourceDto,
} from './dto/create-contractor-resource.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActiveUser } from '../../common/decorators/active-user.decorator';

@Controller('contractors')
@UseGuards(JwtAuthGuard)
export class ContractorsController {
  constructor(private readonly contractorsService: ContractorsService) {}

  @Post()
  create(
    @ActiveUser('tenantId') tenantId: string,
    @Body() createContractorDto: CreateContractorDto,
  ) {
    return this.contractorsService.create(tenantId, createContractorDto);
  }

  @Get()
  findAll(
    @ActiveUser('tenantId') tenantId: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.contractorsService.findAll(tenantId, projectId);
  }

  @Get(':id')
  findOne(@ActiveUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.contractorsService.findOne(tenantId, id);
  }

  @Patch(':id')
  update(
    @ActiveUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() updateContractorDto: UpdateContractorDto,
  ) {
    return this.contractorsService.update(tenantId, id, updateContractorDto);
  }

  @Delete(':id')
  remove(@ActiveUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.contractorsService.remove(tenantId, id);
  }

  // Assignments
  @Get(':id/projects')
  getAssignments(
    @ActiveUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.contractorsService.getAssignments(tenantId, id);
  }

  @Post(':id/projects')
  assignProject(
    @ActiveUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() body: { projectId: string; role?: string },
  ) {
    return this.contractorsService.assignProject(
      tenantId,
      id,
      body.projectId,
      body.role,
    );
  }

  @Delete(':id/projects/:assignmentId')
  removeAssignment(
    @ActiveUser('tenantId') tenantId: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.contractorsService.removeAssignment(tenantId, assignmentId);
  }

  // --- Resources ---
  @Get(':id/resources')
  async getResources(
    @ActiveUser('tenantId') tenantId: string,
    @Param('id') contractorId: string,
  ) {
    console.log(
      `[DEBUG] getResources requested for tenant=${tenantId}, contractor=${contractorId}`,
    );
    const res = await this.contractorsService.getResources(
      tenantId,
      contractorId,
    );
    console.log(`[DEBUG] getResources returned ${res.length} items`);
    return res;
  }

  @Post(':id/resources')
  createResource(
    @ActiveUser('tenantId') tenantId: string,
    @Param('id') contractorId: string,
    @Body() createResourceDto: CreateContractorResourceDto,
  ) {
    return this.contractorsService.createResource(
      tenantId,
      contractorId,
      createResourceDto,
    );
  }

  @Patch('resources/:resourceId')
  updateResource(
    @ActiveUser('tenantId') tenantId: string,
    @Param('resourceId') resourceId: string,
    @Body() updateResourceDto: UpdateContractorResourceDto,
  ) {
    return this.contractorsService.updateResource(
      tenantId,
      resourceId,
      updateResourceDto,
    );
  }

  @Delete('resources/:resourceId')
  removeResource(
    @ActiveUser('tenantId') tenantId: string,
    @Param('resourceId') resourceId: string,
  ) {
    return this.contractorsService.removeResource(tenantId, resourceId);
  }
}
