import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { SignInUserDto, UserDto } from 'src/dtos/user.dto';
import { User } from './models/user.model';
import { CreationAttributes, where } from 'sequelize';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UniqueConstraintError } from 'sequelize';
import { UsernameQueryShema } from 'src/schemas/user.schema';

@Injectable()
export class UserService {
  constructor(
    private sequelize: Sequelize,
    private jwtService: JwtService,
  ) {}

  //registring User
  async signup(
    userDto: UserDto,
  ): Promise<{ message: string; user: Partial<User>; access_token: string }> {
    const transaction = await this.sequelize.transaction();
    try {
      const hashedPassword = await bcrypt.hash(userDto.password, 10);

      const user = await User.create(
        {
          username: userDto.username,
          email: userDto.email,
          password: hashedPassword,
        } as CreationAttributes<User>,
        { transaction },
      );

      const { password, ...userWithoutPassword } = user.get({ plain: true });

      const payload = { sub: user.id, email: user.email };
      const access_token = await this.jwtService.signAsync(payload);

      user.isActive = true;
      await user.save({ transaction });

      await transaction.commit();

      return {
        message: 'User registered successfully',
        user: userWithoutPassword,
        access_token,
      };
    } catch (error) {
      await transaction.rollback();

      if (error instanceof UniqueConstraintError) {
        throw new HttpException(
          'Username or email already exists',
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        'User registration failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //login
  async validateUser(userSignInDto: SignInUserDto) {
    try {
      const user = await User.findOne({
        where: { email: userSignInDto.email },
      });

      if (!user) {
        throw new HttpException(
          'invalid Email and Password',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const comparePassword = bcrypt.compare(
        userSignInDto.password,
        user.password,
      );

      if (!comparePassword) {
        throw new HttpException(
          'invalid Email and Password',
          HttpStatus.UNAUTHORIZED,
        );
      }

      user.isActive = true;
      user.save();

      const { password, ...userWithoutPassword } = user.get({ plain: true });
      const payload = { sub: user.id, email: user.email };
      const access_token = await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
      });
      return {
        message: 'User logged in successfully',
        user: userWithoutPassword,
        access_token,
      };
    } catch (error) {
      throw new HttpException(
        'User Login Failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    
    const user = await User.findByPk(userId);
    // console.log(user,"user");
    if (!user) {
      console.log(`User not found for userId: ${userId}`);
      return;
    }

    user.isActive = isActive;
    if (!isActive) user.lastseen = new Date();

    await user.save();
  }

  async usernameChecking(
    username: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = UsernameQueryShema.safeParse({ username });

      if (!result.success) {
        const resultError = result.error.format().username?._errors || [];
        return {
          success: false,
          message:
            resultError.length > 0
              ? resultError.join(', ')
              : 'Invalid parameter',
        };
      }

      const existingVerifiedUser = await User.findOne({
        where: { username: result.data.username },
      });

      if (existingVerifiedUser) {
        return {
          success: false,
          message: 'Username is already taken',
        };
      }

      return {
        success: true,
        message: 'Username is available and unique',
      };
    } catch (error) {
      console.error('Error in checking username:', error);
      return {
        success: false,
        message: 'Error in checking username please try again later',
      };
    }
  }

  async getingUser(userId: string) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const { password, ...userWithoutPassword } = user.get({ plain: true });

    return userWithoutPassword;
  }

  async updateUser(userId: string, updateData: Partial<UserDto>) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    Object.assign(user, updateData);

    await user.save();

    const { password, ...userWithoutPassword } = user.get({ plain: true });
    return userWithoutPassword;
  }

  async getAllUsers(): Promise<User[]> {
    return await User.findAll({ attributes: { exclude: ['password'] } });
  }
}
