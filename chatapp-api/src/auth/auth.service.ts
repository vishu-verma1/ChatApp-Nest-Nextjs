import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/models/user.model';
import * as bcrypt from 'bcrypt';
import { UserService } from 'src/user/user.service';
import { SignInUserDto, UserDto } from 'src/dtos/user.dto';
@Injectable()
export class AuthService {
  constructor(
    private jwtServices: JwtService,
    private userService: UserService,
  ) {}

  async validateUser(signinUserDto: SignInUserDto): Promise<any> {
    return this.userService.validateUser(signinUserDto);
  }

  async registerUser(userDto: UserDto) {
    return this.userService.signup(userDto);
  }

  async usernameCheking(username: string) {
    return this.userService.usernameChecking(username);
  }
}
