import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async validateUser(password: string, storedHash: string): Promise<boolean> {
    return bcrypt.compare(password, storedHash);
  }

  async login(user: { id: string; email: string }) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}