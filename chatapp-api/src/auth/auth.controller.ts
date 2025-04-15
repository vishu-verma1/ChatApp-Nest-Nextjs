import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { SignInUserDto, UserDto } from 'src/dtos/user.dto';
import {
  createUserSchema,
  signInSchema,
  updateUserSchema,
} from 'src/schemas/user.schema';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('sign-up')
  async signUp(@Body() userDto: UserDto) {
    const validation = createUserSchema.safeParse(userDto);
    if (!validation.success) {
      throw new BadRequestException(validation.error.errors);
    }
    return this.authService.registerUser(userDto);
  }

  @Post('sign-in')
  async signIn(@Body() userSignInDto: SignInUserDto) {
    const validation = signInSchema.safeParse(userSignInDto);
    if (!validation.success) {
      throw new BadRequestException(validation.error.errors);
    }

    return this.authService.validateUser(userSignInDto);
  }

  @Get('valid-username')
  async isValidUsername(@Query('username') username:string){
    return this.authService.usernameCheking(username);
  }
}
