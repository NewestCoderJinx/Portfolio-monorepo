import { BadRequestException, ConflictException, ForbiddenException, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/user.service';
import * as bcrypt from 'bcrypt';
import { RateLimiter } from '../common/rate-limiter';

/** Wrong current-password attempts allowed per account in the window below. */
export const PASSWORD_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  private readonly passwordAttempts = new RateLimiter(PASSWORD_ATTEMPTS, 15 * 60 * 1000);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Only the first account (the site owner) may register. After that, registration
   * is closed unless ALLOW_REGISTRATION=true is set to add another admin.
   */
  async isRegistrationOpen(): Promise<boolean> {
    if (this.config.get<string>('ALLOW_REGISTRATION') === 'true') return true;
    return (await this.usersService.count()) === 0;
  }

  async register(email: string, pass: string) {
    if (!(await this.isRegistrationOpen())) {
      throw new ForbiddenException('Registration is closed');
    }

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(pass, 10);
    const user = await this.usersService.create(email, passwordHash);

    return this.generateToken(user.id, user.email);
  }

  async login(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(user.id, user.email);
  }

  /** The signed-in account, for the Admin Account tab. */
  async me(userId: string): Promise<{ email: string; passwordChangedAt: Date | null; createdAt: Date }> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();
    return { email: user.email, passwordChangedAt: user.passwordChangedAt, createdAt: user.createdAt };
  }

  /**
   * Changes the password after checking the current one. Every other login is revoked
   * (see JwtStrategy); the caller gets a fresh token so this session continues.
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();

    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      if (!this.passwordAttempts.tryHit(userId)) {
        throw new HttpException('Too many wrong attempts. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
      }
      throw new BadRequestException('Current password is incorrect');
    }
    if (currentPassword === newPassword) {
      throw new BadRequestException('The new password must be different from the current one');
    }

    // Whole seconds, because token issue times (iat) are in whole seconds.
    const changedAt = new Date(Math.floor(Date.now() / 1000) * 1000);
    await this.usersService.setPassword(user.id, await bcrypt.hash(newPassword, 10), changedAt);
    return this.generateToken(user.id, user.email);
  }

  private generateToken(userId: string, email: string) {
    return {
      access_token: this.jwtService.sign({ sub: userId, email }),
    };
  }
}