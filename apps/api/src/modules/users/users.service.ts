import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findTenantBySlug(slug: string) {
    return this.prisma.tenant.findUnique({ where: { slug } });
  }

  async create(createUserDto: CreateUserDto) {
    try {
      console.log(
        'Creating user with DTO:',
        JSON.stringify(createUserDto, null, 2),
      );
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
    if (!tenantId) {
      return this.prisma.user.findMany(); // Superadmin?
    }
    return this.prisma.user.findMany({
      where: { tenantId },
      include: { contractor: true },
    });
  }

  async findOne(id: string, tenantId?: string) {
    const whereClause: any = { id };
    if (tenantId) whereClause.tenantId = tenantId;

    return this.prisma.user.findFirst({
      where: whereClause,
      include: { contractor: true, projectMemberships: true },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async findByIdentifier(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
      include: { contractor: true, projectMemberships: true },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    console.log('--- RECV UPDATE USER ---');
    console.log('ID:', id);
    console.log('Payload:', updateUserDto);

    // If updating password, hash it
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    const res = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
    console.log('DB Update Res Name:', res.name, 'Role:', res.role);
    return res;
  }

  async remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  // --- Invite System ---

  async createInvitedUser(
    email: string,
    role: string,
    tenantId: string,
    name?: string,
    contractorId?: string,
  ) {
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const invitationToken =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48); // 48h expiry

    return this.prisma.user.create({
      data: {
        email,
        role,
        tenantId,
        name,
        contractorId, // Optional link to contractor
        status: 'INVITED',
        invitationToken,
        invitationExpires: expiresAt,
        password: null, // No password yet
      },
    });
  }

  async findUserByInvitationToken(token: string) {
    return this.prisma.user.findUnique({
      where: { invitationToken: token },
    });
  }

  async activateUser(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        password: passwordHash,
        status: 'ACTIVE',
        invitationToken: null,
        invitationExpires: null,
      },
    });
  }
}
