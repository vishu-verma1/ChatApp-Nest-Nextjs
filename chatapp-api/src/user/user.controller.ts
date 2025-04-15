import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { SignInUserDto, UserDto } from 'src/dtos/user.dto';
import { UserService } from './user.service';
import {
  createUserSchema,
  signInSchema,
  updateUserSchema,
} from 'src/schemas/user.schema';
import { AuthService } from 'src/auth/auth.service';

import { Request } from 'express';
import { AuthGuard } from 'src/auth/guard/jwt.guard';

@UseGuards(AuthGuard)
@Controller('user')
export class UserController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Put('update-user')
  async updateUser(
    @Req() req: Request,
    @Body() userUpdateDto: Partial<UserDto>,
  ) {
    const validation = updateUserSchema.safeParse(userUpdateDto);
    if (!validation.success) {
      throw new BadRequestException(validation.error.errors);
    }

    if (!req.user) {
      throw new UnauthorizedException('Invalid Credentials, Please login');
    }

    const userId = req.user['sub'];
    const updatedUser = await this.userService.updateUser(
      userId,
      userUpdateDto,
    );

    return {
      message: 'User updated successfully',
      user: updatedUser,
    };
  }


  @Get('profile')
  async getUserProfile(@Req() req: Request) {
    console.log('User from Request:', req.user);
    if (!req.user) {
      throw new UnauthorizedException('Invalid Credentials, Please login');
    }
    const userId = req.user['sub'];

    return this.userService.getingUser(userId);
  }
  
  @Get('users-list')
  async usersList() {
    const users = await this.userService.getAllUsers();

    return {
      message: 'List of registered users',
      users,
    };
  }
}
