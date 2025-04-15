import { Injectable } from '@nestjs/common';
import { Notification } from './models/notification.model';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification) private notificationModel: typeof Notification,
  ) {}

  async saveNotification(
    senderId: string,
    receiverId: string,
    content: string,
  ) {
    return await this.notificationModel.create({
      senderId,
      receiverId,
      content,
    });
  }

  async getNotification(receiverId: string) {
    const allNotification= await this.notificationModel.findAll({
      where: { receiverId, isRead: false },
    });
    // console.log(vt,"==============")
    return allNotification;
  }

  async markAsRead(notificationId: string) {
    console.log('Marking notification as read with ID:', notificationId);
    const result = await this.notificationModel.update(
      { isRead: true },
      { where: { id: notificationId } },
    );
    // console.log('Update result:', result);
    return result;
  }
}
