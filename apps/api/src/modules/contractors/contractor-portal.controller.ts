import { Controller, Get, UseGuards, UnauthorizedException, Query } from '@nestjs/common';
import { ContractorsService } from './contractors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActiveUser } from '../../common/decorators/active-user.decorator';

@Controller('portal/contractor')
@UseGuards(JwtAuthGuard)
export class ContractorPortalController {
    constructor(private readonly contractorsService: ContractorsService) { }

    // Helper to validate and get contractorId
    // In a real implementation, this would be a custom Guard or Decorator leveraging the User's role/contractorId claim
    // For now, we assume the user object populated by JwtStrategy has it, or we fetch it.
    // Based on User update, we need to ensure the JWT strategy (or a secondary lookup) provides contractorId.
    // If JWT payload doesn't have it yet, we might need to fetch the user.
    // Let's assume ActiveUser returns the full user payload including 'contractorId' if we added it to the JWT payload.
    // If not, we have to look it up. To be safe for MVP without modifying Auth module deeply yet:
    // I'll inject the whole user and check.

    @Get('me')
    async getProfile(@ActiveUser() user: any) {
        if (!user.contractorId) throw new UnauthorizedException('Not a contractor user');
        return this.contractorsService.findOne(user.tenantId, user.contractorId);
    }

    @Get('projects')
    async getProjects(@ActiveUser() user: any) {
        if (!user.contractorId) throw new UnauthorizedException('Not a contractor user');
        return this.contractorsService.getAssignments(user.tenantId, user.contractorId);
    }

    @Get('dashboard')
    async getDashboard(@ActiveUser() user: any) {
        if (!user.contractorId) throw new UnauthorizedException('Not a contractor user');
        return this.contractorsService.getPortalDashboard(user.tenantId, user.contractorId);
    }

    @Get('tasks')
    async getTasks(@ActiveUser() user: any, @Query('status') status?: string) {
        if (!user.contractorId) throw new UnauthorizedException('Not a contractor user');
        return this.contractorsService.getPortalTasks(user.tenantId, user.contractorId, status);
    }

    @Get('orders')
    async getPurchaseOrders(@ActiveUser() user: any) {
        if (!user.contractorId) throw new UnauthorizedException('Not a contractor user');
        return this.contractorsService.getPortalOrders(user.tenantId, user.contractorId);
    }
}
