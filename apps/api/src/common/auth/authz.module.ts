import { Global, Module } from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import { PermissionRepository } from './repositories/permission.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [AuthorizationService, PermissionRepository],
  exports: [AuthorizationService, PermissionRepository],
})
export class AuthzModule {}
