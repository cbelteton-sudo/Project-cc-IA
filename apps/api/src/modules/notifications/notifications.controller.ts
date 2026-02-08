
import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { ActiveUser } from '../../common/decorators/active-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    findAll(@ActiveUser() user: any) {
        return this.notificationsService.findAll(user.userId);
    }

    @Patch(':id/read')
    markAsRead(@Param('id') id: string, @ActiveUser() user: any) {
        return this.notificationsService.markAsRead(id, user.userId);
    }

    @Get('unread-count')
    getUnreadCount(@ActiveUser() user: any) {
        return this.notificationsService.listUnread(user.userId);
    }
}
