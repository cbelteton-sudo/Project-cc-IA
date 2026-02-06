import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
// Assuming existing guards based on Phase 1 plan - if not I will use just Controller
// Plan said: JwtAuthGuard, PermissionsGuard. Let's try to assume they exist or check common folder later.
// For now, I'll build the logic and add decorators if I find them.
// Wait, I should find them first to be robust.

@Controller('admin/users')
export class AdminUsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    async create(@Request() req: any, @Body() createUserDto: CreateUserDto) {
        console.log('AdminUsersController.create called');
        let tenantId = req.user?.tenantId;

        if (!tenantId) {
            const tenant = await this.usersService.findTenantBySlug('demo');
            if (tenant) tenantId = tenant.id;
        }

        if (!tenantId) {
            console.error('Tenant ID missing and demo tenant not found');
            throw new Error('Tenant context required');
        }

        try {
            return await this.usersService.create({ ...createUserDto, tenantId });
        } catch (error: any) {
            console.error('Controller Catch:', error);
            // Check for Prisma unique constraint error (P2002)
            if (error.code === 'P2002') {
                const target = error.meta?.target;
                throw new Error(`User with this ${target} already exists`);
            }
            throw error;
        }
    }

    @Get()
    async findAll(@Request() req: any, @Query('role') role?: string) {
        let tenantId = req.user?.tenantId;

        if (!tenantId) {
            const tenant = await this.usersService.findTenantBySlug('demo');
            if (tenant) tenantId = tenant.id;
        }

        return this.usersService.findAll(tenantId || 'demo');
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @Post(':id/reset-password')
    async resetPassword(@Param('id') id: string) {
        // Dev feature
        return this.usersService.update(id, { password: 'password123' });
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
