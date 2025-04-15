import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Messages } from 'src/messages/models/messages.model';
import { User } from 'src/user/models/user.model';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Op, where } from 'sequelize';

@Injectable()
export class ChatService {
  algorithm = 'aes-256-ctr';
  encryptionKey = '12345678901234567890123456789012';

  constructor(
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(Messages) private messageModel: typeof Messages,
    private configService: ConfigService,
  ) {}

  encryptText(content: string): { iv: string; encryptedData: string } {
    // const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.encryptionKey, //encryptionKey
      iv,
    );
    let encrypted = cipher.update(content, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return { iv: iv.toString('hex'), encryptedData: encrypted };
  }

  decryptText(ivHex: string, encryptedData: string): string {
    if (!ivHex) {
      throw new Error('ivHex is undefined');
    }
    const iv = Buffer.from(ivHex, 'hex');
    const dcipher = crypto.createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
    );
    let decrypted = dcipher.update(encryptedData, 'hex', 'utf-8');
    decrypted += dcipher.final('utf-8');
    return decrypted;
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.userModel.findByPk(userId);
  }

  async saveMessage(
    senderId: string,
    receiverId: string,
    content: string,
    imageUrl?: string,
  ) {
    const { iv, encryptedData } = this.encryptText(content);
    return await this.messageModel.create({
      senderId,
      receiverId,
      content: encryptedData,
      iv,
      imageUrl,
    });
  }

  async getMessage(viewerId: string, otherUserId: string) {
    const messages = await this.messageModel.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { senderId: viewerId, receiverId: otherUserId },
              { senderId: otherUserId, receiverId: viewerId },
            ],
          },
          {
            [Op.or]: [
              // for receiver: exclude if marked deleted from their view
              { senderId: otherUserId, deletedForReceiver: false },
              // for sender: always include, even if deletedForSender is true
              { senderId: viewerId },
            ],
          },
        ],
      },
      order: [['createdAt', 'ASC']],
    });

    return messages.map((message) => {
      const messageData = message.get({ plain: true });

      if (messageData.deletedForEveryone) {
        // global deletion visible to both sides
        return { ...messageData, content: 'This message was deleted' };
      }

      // If the viewer is the sender and they deleted it for themselves, replace content
      if (messageData.senderId === viewerId && messageData.deletedForSender) {
        return { ...messageData, content: 'This message was deleted' };
      }

      // Otherwise, return the original (or decrypted) content
      if (!messageData.iv) {
        throw new Error('iv is undefined in the message');
      }
      return {
        ...messageData,
        content: this.decryptText(messageData.iv, messageData.content),
      };
    });
  }

  // async deleteMessages(messageId: string, userId: string, deleteForEveryone: boolean) {
  //   const message = await this.messageModel.findOne({ where: { id: messageId } });

  //   if (!message) {
  //     throw new Error('Message not found');
  //   }

  //   const isSender = message.senderId === userId;
  //   const isWithin24Hours =
  //     new Date().getTime() - new Date(message.createdAt).getTime() <= 24 * 60 * 60 * 1000;

  //   if (deleteForEveryone) {
  //     if (!isSender) {
  //       throw new Error('Only the sender can delete the message for everyone');
  //     }

  //     if (!isWithin24Hours) {
  //       throw new Error('Cannot delete the message for everyone after 24 hours');
  //     }

  //     //hard
  //     message.isDeleted = true;
  //     message.deletedForEveryone = true;
  //     await message.save();

  //   } else {

  //     if (!isSender) {
  //       throw new Error('Unauthorized to delete this message');
  //     }
  //     //soft
  //     message.isDeleted = true;
  //     await message.save();
  //   }

  //   return message;
  // }

  async markMessageAsSeen(receiverId: string, senderId: string) {
    await this.messageModel.update(
      { isSeen: true },
      { where: { senderId, receiverId, isSeen: false } },
    );

    return this.messageModel.findAll({
      where: { senderId, receiverId, isSeen: true },
    });
  }

  async updateMessageStatus(
    messageId: string,
    status: Partial<{
      isSeen: boolean;
      isDelivered: boolean;
      isDeleted: boolean;
      deletedForEveryone: boolean;
      deletedForSender?: boolean;
      deletedForReceiver?: boolean;
    }>,
  ) {
    // console.log(status, '------');
    await this.messageModel.update(status, { where: { id: messageId } });
    return this.messageModel.findByPk(messageId);
  }

  async getMessageById(messageId: string) {
    return this.messageModel.findByPk(messageId);
  }

  async deleteMessageForReceiver(messageId: string, receiverId: string) {
    await this.messageModel.update(
      { deletedForReceiver: true },
      { where: { id: messageId } },
    );
    return this.messageModel.findByPk(messageId);
  }
}
