import { Controller, Get, Param, Patch } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get(':userId')
  async getNotifications(@Param('userId') userId: string) {
    return this.notificationService.getNotification(userId);
  }

  @Patch('mark-as-read/:id')
  markNotificationAsRead(@Param('id') id: string) {
    // console.log(id,"-----")
    return this.notificationService.markAsRead(id);
  }
}
