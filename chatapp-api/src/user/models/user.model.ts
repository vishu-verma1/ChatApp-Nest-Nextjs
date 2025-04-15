import {
  AllowNull,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Messages } from 'src/messages/models/messages.model';

@Table
export class User extends Model<User> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    unique: true,
  })
  declare username: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    unique: true,
  })
  declare email: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
  })
  declare password: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isActive: boolean;

  @AllowNull(true)
  @Column({
    type: DataType.DATE,
  })
  declare lastseen: Date;

  @HasMany(() => Messages, 'senderId')
  declare sentMessages: Messages[]; // sending messages

  @HasMany(() => Messages, 'receiverId')
  declare receivedMessages: Messages[]; // receiving messages
}