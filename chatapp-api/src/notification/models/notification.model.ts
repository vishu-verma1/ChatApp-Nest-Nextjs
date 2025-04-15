import { DefaultValuePipe } from '@nestjs/common';
import { Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { User } from 'src/user/models/user.model';

@Table
export class Notification extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare senderId: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare receiverId: string;

  @Column({
    type: DataType.STRING,
  })
  declare content: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isRead: boolean;
}
