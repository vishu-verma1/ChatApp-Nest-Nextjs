import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './models/user.model';
import { UserController } from './user.controller';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
// import { UserGateway } from './user.gateway';

@Module({
  imports:[ SequelizeModule.forFeature([User]),
  forwardRef(() => AuthModule),
],
   
  
  // providers: [UserService, UserGateway],
  providers: [UserService],
  exports:[SequelizeModule, UserService],
  controllers: [UserController]
})
export class UserModule {}
