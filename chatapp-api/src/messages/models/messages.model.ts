import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from 'src/user/models/user.model';

@Table({ timestamps: true })
export class Messages extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.TEXT,
  })
  declare content: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare senderId: string;

  @Column({
    type: DataType.STRING,
  })
  declare iv: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isDeleted: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare deletedForEveryone: boolean;
  
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare deletedForSender: boolean;
  
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare deletedForReceiver: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isSeen: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isDelivered: boolean;

  @Column({
    type: DataType.STRING,
  })
  declare imageUrl: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare receiverId: string;

  @BelongsTo(() => User, 'senderId')
  sender: User;

  @BelongsTo(() => User, 'receiverId')
  receiver: User;
}
