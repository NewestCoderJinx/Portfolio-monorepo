import { BadRequestException, ConflictException, ForbiddenException, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/user.service';
import * as bcrypt from 'bcrypt';
import { RateLimiter } from '../common/rate-limiter';
import { SessionsService } from './sessions.service';

/** Where a sign-in came from, stored on its session. */
export interface ClientInfo {
  ip?: string;
  userAgent?: string;
}

/** Wrong current-password attempts allowed per account in the window below. */
export const PASSWORD_ATTEMPTS = 5;
/** Failed logins allowed per client IP in the window below; a successful login clears the count. */
export const LOGIN_ATTEMPTS = 10;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly passwordAttempts = new RateLimiter(PASSWORD_ATTEMPTS, ATTEMPT_WINDOW_MS);
  private readonly loginFailures = new RateLimiter(LOGIN_ATTEMPTS, ATTEMPT_WINDOW_MS);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly sessions: SessionsService,
  ) {}

  /**
   * Only the first account (the site owner) may register. After that, registration
   * is closed unless ALLOW_REGISTRATION=true is set to add another admin.
   */
  async isRegistrationOpen(): Promise<boolean> {
    if (this.config.get<string>('ALLOW_REGISTRATION') === 'true') return true;
    return (await this.usersService.count()) === 0;
  }

  async register(email: string, pass: string, client: ClientInfo = {}) {
    if (!(await this.isRegistrationOpen())) {
      throw new ForbiddenException('Registration is closed');
    }

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(pass, 10);
    const user = await this.usersService.create(email, passwordHash);

    return this.startSession(user.id, user.email, client);
  }

  /** The caller's IP is blocked after LOGIN_ATTEMPTS failures, before the password is even checked. */
  async login(email: string, pass: string, client: ClientInfo = {}) {
    const clientKey = client.ip ?? 'unknown';
    if (this.loginFailures.isLimited(clientKey)) {
      throw new HttpException('Too many failed sign-in attempts. Please try again in 15 minutes.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const user = await this.usersService.findByEmail(email);
    if (!user || !(await bcrypt.compare(pass, user.passwordHash))) {
      this.loginFailures.tryHit(clientKey);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.loginFailures.reset(clientKey);
    return this.startSession(user.id, user.email, client);
  }

  /** The signed-in account, for the Admin Account tab. */
  async me(userId: string): Promise<{ email: string; passwordChangedAt: Date | null; createdAt: Date }> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();
    return { email: user.email, passwordChangedAt: user.passwordChangedAt, createdAt: user.createdAt };
  }

  /** Changes the password after checking the current one, and signs out every other session. */
  async changePassword(userId: string, sessionId: string, currentPassword: string, newPassword: string): Promise<{ signedOut: number }> {
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

    await this.usersService.setPassword(user.id, await bcrypt.hash(newPassword, 10), new Date());
    return { signedOut: await this.sessions.revokeOthers(user.id, sessionId) };
  }

  private async startSession(userId: string, email: string, client: ClientInfo) {
    const session = await this.sessions.create(userId, client.userAgent, client.ip);
    return {
      access_token: this.jwtService.sign({ sub: userId, email, sid: session.id }),
    };
  }
}