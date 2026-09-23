import { Controller, Get, Param, Patch, UseGuards, Sse, MessageEvent } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Observable, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@UseGuards(JwtAuthGuard)
@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getMyNotifications(@CurrentUser() user: any) {
    return this.notificationsService.getUserNotifications(user.userId);
  }

  @Sse('stream')
  stream(@CurrentUser() user: any): Observable<MessageEvent> {
    return interval(5000).pipe(
      switchMap(async () => {
        const notifications = await this.notificationsService.getUserNotifications(user.userId);
        const unread = notifications.filter(n => !n.isRead);
        return { data: { unreadCount: unread.length, notifications: unread } } as MessageEvent;
      })
    );
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }
}
