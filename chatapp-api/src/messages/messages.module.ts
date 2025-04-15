import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Messages } from './models/messages.model';
import { MessagesController } from './messages.controller';

@Module({
  imports:[SequelizeModule.forFeature([Messages])],
  providers: [MessagesService],
  exports:[SequelizeModule],
  controllers: [MessagesController]

})
export class MessagesModule {}
