
import { Module } from '@nestjs/common';
import { PMDashboardService } from './pm-dashboard.service';
import { PMDashboardController } from './pm-dashboard.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [PrismaModule, NotificationsModule],
    controllers: [PMDashboardController],
    providers: [PMDashboardService],
})
export class PMDashboardModule { }
