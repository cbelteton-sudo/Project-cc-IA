import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ActiveUser } from '../../common/decorators/active-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'DIRECTOR')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@ActiveUser() user: any, @Body() createUserDto: CreateUserDto) {
    console.log('AdminUsersController.create called');
    const tenantId = user.tenantId;

    if (!tenantId) {
      console.error('Tenant ID missing in token');
      throw new UnauthorizedException('Tenant context required');
    }

    try {
      return await this.usersService.create({ ...createUserDto, tenantId });
    } catch (error: any) {
      console.error('Controller Catch:', error);
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        throw new Error(`User with this ${target} already exists`);
      }
      throw error;
    }
  }

  @Get()
  async findAll(@ActiveUser() user: any, @Query('role') role?: string) {
    const tenantId = user.tenantId;
    if (!tenantId) throw new UnauthorizedException('Tenant context required');
    return this.usersService.findAll(tenantId);
  }

  @Get(':id')
  async findOne(@ActiveUser() user: any, @Param('id') id: string) {
    const tenantId = user.tenantId;
    const foundUser = await this.usersService.findOne(id, tenantId);
    if (!foundUser) throw new NotFoundException('User not found');
    return foundUser;
  }

  @Patch(':id')
  async update(
    @ActiveUser() user: any,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const tenantId = user.tenantId;
    const existingUser = await this.usersService.findOne(id, tenantId);
    if (!existingUser) throw new NotFoundException('User not found');
    return this.usersService.update(id, updateUserDto);
  }

  @Post(':id/reset-password')
  async resetPassword(@ActiveUser() user: any, @Param('id') id: string) {
    const tenantId = user.tenantId;
    const existingUser = await this.usersService.findOne(id, tenantId);
    if (!existingUser) throw new NotFoundException('User not found');
    return this.usersService.update(id, { password: 'password123' });
  }

  @Delete(':id')
  async remove(@ActiveUser() user: any, @Param('id') id: string) {
    const tenantId = user.tenantId;
    const existingUser = await this.usersService.findOne(id, tenantId);
    if (!existingUser) throw new NotFoundException('User not found');
    return this.usersService.remove(id);
  }
}
