import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { NotificationService } from 'src/notification/notification.service';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { date, string } from 'zod';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly chatService: ChatService,
    private readonly notificationService: NotificationService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  @WebSocketServer()
  server: Server;

  private activeUsers = new Map<string, string>(); // userId and socketId
  private userChatWindows = new Map<string, string | null>();

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.query.token as string;
      if (!token) throw new UnauthorizedException('No token provided');

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      const userId = payload.sub;

      client.data.user = { id: payload.sub, email: payload.email };

      this.activeUsers.set(userId, client.id);
      await this.userService.updateUserStatus(userId, true);
      this.broadcastActiveUsers();
    } catch (error) {
      console.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = [...this.activeUsers.entries()].find(
      ([, socketId]) => socketId === client.id,
    )?.[0];

    if (userId) {
      this.activeUsers.delete(userId);
      await this.userService.updateUserStatus(userId, false);
      this.broadcastActiveUsers();
    }
  }

  // @SubscribeMessage('userjoined')
  // async handleUserJoined(
  //   @MessageBody() data: { userId: string },
  //   @ConnectedSocket() client: Socket,
  // ) {}

  broadcastActiveUsers() {
    const activeUserIds = Array.from(this.activeUsers.keys());
    console.log('Broadcasting active users:', activeUserIds);
    this.server.emit('activeUsers', activeUserIds);
  }

  @SubscribeMessage('openChatWindow')
  async handleOpenChatWindow(
    @MessageBody() data: { userId: string; receiverId: string | null },
    @ConnectedSocket() client: Socket,
  ) {
    this.userChatWindows.set(data.userId, data.receiverId);
    // console.log(data.userId, "======")
    if (data.receiverId) {
      const unseenMessages = await this.chatService.markMessageAsSeen(
        data.userId,
        data.receiverId,
      );

      const senderSocketId = this.activeUsers.get(data.receiverId);
      if (senderSocketId) {
        unseenMessages.forEach((message) => {
          const decryptedMessage = {
            ...message.get({ plain: true }),
            content: this.chatService.decryptText(message.iv, message.content),
          };

          this.server.to(senderSocketId).emit('messageStatusUpdated', {
            ...decryptedMessage,
            isSeen: true,
          });
        });
      }
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody()
    data: {
      senderId: string;
      receiverId: string;
      content: string;
      tempId?: string;
      imageUrl?:string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data.senderId || !data.receiverId || (!data.content && !data.imageUrl)) return;

    const receiverSocketId = this.activeUsers.get(data.receiverId);
    const sender = await this.chatService.getUserById(data.senderId);
    if (!sender) return;
    const savedMessage = await this.chatService.saveMessage(
      data.senderId,
      data.receiverId,
      data.content,
      data.imageUrl,
    );
    // console.log(data.senderId, data.receiverId,data.content, data.imageUrl, "+++++++" )
    // console.log(savedMessage.iv,"ijjv")
    const decryptedMessage = { 
      ...savedMessage.get({ plain: true }),
      content: this.chatService.decryptText(savedMessage.iv, savedMessage.content),
    }
      // console.log(decryptedMessage,"ijjv")

    // console.log(decryptedMessage,"[[[", receiverSocketId, "--------/////////----")
    const openChatWindow = this.userChatWindows.get(data.receiverId);

    if (receiverSocketId && openChatWindow === data.senderId) {
      await this.chatService.updateMessageStatus(savedMessage.id, {
        isDelivered: true,
        isSeen: true,
      });

      client.to(receiverSocketId).emit('receiveMessage', {
        ...decryptedMessage,
        isDelivered: true,
        tempId: data.tempId,
        isSeen: true,
      });

      client.emit('messageStatusUpdated', {
        ...decryptedMessage,
        tempId: data.tempId,
        isDelivered: true,
        isSeen: true,
      });
    } else if (receiverSocketId) {
      await this.chatService.updateMessageStatus(savedMessage.id, {
        isDelivered: true,
      });
      await this.notificationService.saveNotification(
        data.senderId,
        data.receiverId,
        `New Message from ${sender.username}`,
      );

      client.emit('messageStatusUpdated', {
        ...decryptedMessage,
        isDelivered: true,
        isSeen: false,
        tempId: data.tempId,
      });

      

      this.server.to(client.id).emit('receiveNotification', {
        from: data.senderId,
        content: `New Message from ${data.senderId}`,
        senderId: data.senderId,
      });
    } else {
      await this.notificationService.saveNotification(
        data.senderId,
        data.receiverId,
        `New Message from ${sender.username}`,
      );

      client.emit('messageStatusUpdated', {
        ...decryptedMessage,
        tempId: data.tempId,
      });

      this.server.to(client.id).emit('receiveNotification', {
        from: data.senderId,
        content: `New Message from ${data.senderId}`,
        senderId: data.senderId,
      });
    }
  }

  @SubscribeMessage('getChatHistory')
  async handleGetChatHistory(
    @MessageBody() data: { senderId: string; receiverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // console.log(data.receiverId, data.senderId, '-------');
    const messages = await this.chatService.getMessage(
      data.senderId,
      data.receiverId,
    );

    // await this.chatService.markMessageAsSeen(data.receiverId, data.senderId);
    // console.log(messages, '-kiookoio');
    client.emit('chatHistory', messages);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { senderId: string; receiverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const receiverSocketId = this.activeUsers.get(data.receiverId);
    if (receiverSocketId) {
      // console.log('Typing event received -:', data);
      this.server
        .to(receiverSocketId)
        .emit('userTyping', { senderId: data.senderId });
    }
  }

  @SubscribeMessage('seenMessage')
  async handleSeenMessage(
    @MessageBody() data: { messageId: string; tempId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    // console.log('enterd');
    const message = await this.chatService.getMessageById(data.messageId);
    if (!message) return;

    const receiverId = message.receiverId;
    const senderId = message.senderId;

    const openChatWindow = this.userChatWindows.get(receiverId);
    const receiverSocketId = this.activeUsers.get(receiverId);

    if (openChatWindow !== senderId) return;
    if (!receiverSocketId) return;

    const updatedMessage = await this.chatService.updateMessageStatus(
      data.messageId,
      { isSeen: true, isDelivered: true }
    );

    if (!updatedMessage) return;

    const senderSocketId = this.activeUsers.get(senderId ?? '');
    const decryptedMessage = {
      ...updatedMessage.get({ plain: true }),
      content: this.chatService.decryptText(
        updatedMessage.iv,
        updatedMessage.content,
      ),
    };

    if (senderSocketId) {
      this.server.to(senderSocketId).emit('messageStatusUpdated', {
        ...decryptedMessage,
        isDelivered: true,
        isSeen: true,
        tempId: data.tempId,
      });
    }
  }

  @SubscribeMessage('getActiveUsers')
  handleGetActiveUsers(@ConnectedSocket() client: Socket) {
    const activeUserIds = Array.from(this.activeUsers.keys());
    client.emit('activeUsers', activeUserIds);
    // console.log(activeUserIds,"====+++++===")
  }

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @MessageBody()
    data: { messageId: string; userId: string; deleteForEveryone: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const { messageId, userId, deleteForEveryone } = data;
    // console.log(userId, messageId, '--00');
    const message = await this.chatService.getMessageById(messageId);
    if (!message) {
      client.emit('error', { message: 'Message not found' });
      return;
    }

    const isSender = message.senderId == userId;
    const isWithin24Hours =
      new Date().getTime() - new Date(message.createdAt).getTime() <=
      24 * 60 * 60 * 1000;

    if (deleteForEveryone) {
      if (!isSender) {
        client.emit('error', {
          message: 'Only the sender can delete the message for everyone',
        });
        return;
      }

      if (!isWithin24Hours) {
        client.emit('error', {
          message: 'Cannot delete the message for everyone after 24 hours',
        });
        return;
      }

      await this.chatService.updateMessageStatus(messageId, {
        isDeleted: true,
        deletedForEveryone: true,
      });

      // Notify all clients about the deletion
      this.server.emit('messageDeleted', {
        messageId,
        deleteForEveryone: true,
      });
    } else {
      if (isSender) {
        await this.chatService.updateMessageStatus(messageId, {
          deletedForSender: true,
        });
        client.emit('messageDeleted', { messageId, deleteForEveryone: false });
      } else {
        await this.chatService.deleteMessageForReceiver(messageId, userId);
        client.emit('messageDeleted', { messageId, deleteForEveryone: false });
      }
    }
  }
}
