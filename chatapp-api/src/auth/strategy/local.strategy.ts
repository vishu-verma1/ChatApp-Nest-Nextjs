import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { SignInUserDto } from 'src/dtos/user.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' }); // Email-based login
  }

  async validate(signinUserDto:SignInUserDto) {
    const user = await this.authService.validateUser(signinUserDto);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return user;
  }
}
