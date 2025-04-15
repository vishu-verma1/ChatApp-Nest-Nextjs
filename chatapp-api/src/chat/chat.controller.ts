import { Controller, Delete, Param, Query } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
  // @Delete('meesage-delete/:messageId')
  // deleteMessage(
  //   @Param('messagId') messageId: string,
  //   @Query('userId') userId: string,
  // ) {
  //   return this.chatService.deleteMessages(messageId, userId,);
  // }

  



}
