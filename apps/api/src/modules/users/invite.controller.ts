import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/invite')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class InviteController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async inviteUser(
    @Body()
    body: { email: string; role: string; name?: string; contractorId?: string },
    @Req() req: any,
  ) {
    const { email, role, name, contractorId } = body;
    const tenantId = req.user.tenantId;

    if (!tenantId) {
      throw new BadRequestException('Tenant context is missing');
    }

    try {
      const user = await this.usersService.createInvitedUser(
        email,
        role,
        tenantId,
        name,
        contractorId,
      );

      // MOCK EMAIL SENDING
      console.log('---------------------------------------------------');
      console.log(`📧 MOCK EMAIL TO: ${body.email}`);
      console.log(`SUBJECT: You have been invited to FieldClose`);
      console.log(
        `LINK: http://localhost:5173/accept-invite?token=${user.invitationToken}`,
      );
      console.log('---------------------------------------------------');

      return {
        message: 'Invitation sent (mocked)',
        invitationToken: user.invitationToken, // Returning for testing purposes
      };
    } catch (error: any) {
      console.error('Error inviting user:', error);
      if (error.message === 'User already exists') {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Failed to invite user');
    }
  }
}
