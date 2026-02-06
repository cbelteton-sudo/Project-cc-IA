import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async findTenantBySlug(slug: string) {
    return this.prisma.tenant.findUnique({ where: { slug } });
  }

  async create(createUserDto: CreateUserDto) {
    try {
      console.log('Creating user with DTO:', JSON.stringify(createUserDto, null, 2));
      let hashedPassword;
      if (createUserDto.password) {
        hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      } else {
        hashedPassword = await bcrypt.hash('temp1234', 10);
      }

      const result = await this.prisma.user.create({
        data: {
          ...createUserDto,
          password: hashedPassword,
        },
      });
      console.log('User created successfully:', result.id);
      return result;
    } catch (error) {
      console.error('Error in UsersService.create:', error);
      throw error;
    }
  }

  // Admin: Find all users for a tenant (filtered)
  async findAll(tenantId?: string) {
    if (!tenantId) return this.prisma.user.findMany(); // Superadmin?
    return this.prisma.user.findMany({
      where: { tenantId },
      include: { contractor: true }
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { contractor: true }
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // If updating password, hash it
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
