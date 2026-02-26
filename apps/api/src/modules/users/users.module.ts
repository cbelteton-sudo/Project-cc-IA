import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AdminUsersController } from './admin-users.controller';
import { InviteController } from './invite.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController, AdminUsersController, InviteController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
