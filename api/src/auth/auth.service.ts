import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { AuditAction } from '../audit/audit-event.entity';
import { AuditService } from '../audit/audit.service';
import type { User } from '../users/user.entity';
import { UsersService } from '../users/user.service';
import * as bcrypt from 'bcrypt';
import { RateLimiter } from '../common/rate-limiter';
import { SessionsService } from './sessions.service';
import { generateRecoveryCodes, generateTotpSecret, hashRecoveryCode, otpauthUri, verifyTotp } from './totp';

/** Where a sign-in came from, stored on its session. */
export interface ClientInfo {
  ip?: string;
  userAgent?: string;
}

/** Wrong current-password attempts allowed per account in the window below. */
export const PASSWORD_ATTEMPTS = 5;
/** Failed logins allowed per client IP in the window below; a successful login clears the count. */
export const LOGIN_ATTEMPTS = 10;
/** Wrong 2FA codes allowed per account in the window below, across sign-in and the Account tab. */
export const CODE_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
/** How long the owner has to type their code after the password was accepted. */
const CHALLENGE_TTL_SECONDS = 5 * 60;
const CHALLENGE_PURPOSE = '2fa-login';

export type LoginResult = { access_token: string } | { twoFactorRequired: true; challenge: string };

@Injectable()
export class AuthService {
  private readonly passwordAttempts = new RateLimiter(PASSWORD_ATTEMPTS, ATTEMPT_WINDOW_MS);
  private readonly loginFailures = new RateLimiter(LOGIN_ATTEMPTS, ATTEMPT_WINDOW_MS);
  private readonly codeFailures = new RateLimiter(CODE_ATTEMPTS, ATTEMPT_WINDOW_MS);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly sessions: SessionsService,
    private readonly audit: AuditService,
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
    await this.log('auth.register', client, { userId: user.id, email: user.email });

    return this.startSession(user.id, user.email, client);
  }

  /**
   * Checks the password. With 2FA on, the result is a short-lived challenge to send back with a code
   * (see loginWithCode) instead of a session. The caller's IP is blocked after LOGIN_ATTEMPTS failures,
   * before the password is even checked.
   */
  async login(email: string, pass: string, client: ClientInfo = {}): Promise<LoginResult> {
    const clientKey = client.ip ?? 'unknown';
    await this.assertNotBlocked(clientKey, client, email);

    const user = await this.usersService.findByEmail(email);
    if (!user || !(await bcrypt.compare(pass, user.passwordHash))) {
      this.loginFailures.tryHit(clientKey);
      await this.log('auth.login_failed', client, { userId: user?.id, email });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.totpEnabledAt) {
      const challenge = this.jwtService.sign({ sub: user.id, purpose: CHALLENGE_PURPOSE }, { expiresIn: CHALLENGE_TTL_SECONDS });
      return { twoFactorRequired: true, challenge };
    }

    this.loginFailures.reset(clientKey);
    await this.log('auth.login', client, { userId: user.id, email: user.email });
    return this.startSession(user.id, user.email, client);
  }

  /** Second sign-in step: the challenge from login() plus an authenticator or recovery code. */
  async loginWithCode(challenge: string, code: string, client: ClientInfo = {}) {
    const clientKey = client.ip ?? 'unknown';
    await this.assertNotBlocked(clientKey, client);

    let payload: { sub?: string; purpose?: string };
    try {
      payload = this.jwtService.verify(challenge);
    } catch {
      throw new UnauthorizedException('That took too long. Please sign in again.');
    }
    const user = payload.purpose === CHALLENGE_PURPOSE && payload.sub ? await this.usersService.findById(payload.sub) : null;
    if (!user?.totpEnabledAt) throw new UnauthorizedException('Please sign in again.');

    this.assertCodesAllowed(user.id);
    const used = await this.useSecondFactor(user, code, client);
    if (!used) {
      this.loginFailures.tryHit(clientKey);
      throw new UnauthorizedException('That code didn’t work. Check your authenticator app and try again.');
    }
    this.loginFailures.reset(clientKey);
    await this.log('auth.login', client, { userId: user.id, email: user.email, detail: { twoFactor: used } });
    return this.startSession(user.id, user.email, client);
  }

  /** The signed-in account, for the Admin Account tab. */
  async me(userId: string) {
    const user = await this.requireUser(userId);
    return {
      email: user.email,
      passwordChangedAt: user.passwordChangedAt,
      createdAt: user.createdAt,
      twoFactorEnabledAt: user.totpEnabledAt,
      recoveryCodesLeft: user.totpEnabledAt ? (user.totpRecoveryCodes?.length ?? 0) : null,
    };
  }

  /** Starts turning on 2FA: a new secret for the authenticator app. Nothing changes at sign-in until enableTwoFactor. */
  async setupTwoFactor(userId: string): Promise<{ secret: string; otpauthUrl: string }> {
    const user = await this.requireUser(userId);
    if (user.totpEnabledAt) throw new ConflictException('Two-step verification is already on');
    const secret = generateTotpSecret();
    await this.usersService.update(user.id, { totpSecret: secret, totpLastUsedStep: null, totpRecoveryCodes: null });
    return { secret, otpauthUrl: otpauthUri(secret, user.email, this.issuer()) };
  }

  /** Finishes turning on 2FA once the app produces a valid code. The recovery codes are shown only this once. */
  async enableTwoFactor(userId: string, code: string, client: ClientInfo = {}): Promise<{ recoveryCodes: string[] }> {
    const user = await this.requireUser(userId);
    if (user.totpEnabledAt) throw new ConflictException('Two-step verification is already on');
    if (!user.totpSecret) throw new BadRequestException('Start the setup again');
    this.assertCodesAllowed(user.id);
    const step = verifyTotp(user.totpSecret, code, null);
    if (step === null) await this.failCode(user.id, client);

    const recoveryCodes = generateRecoveryCodes();
    await this.usersService.update(user.id, {
      totpEnabledAt: new Date(),
      totpLastUsedStep: step,
      totpRecoveryCodes: recoveryCodes.map(hashRecoveryCode),
    });
    await this.log('auth.2fa_enabled', client, { userId: user.id });
    return { recoveryCodes };
  }

  /** Turns 2FA off; needs the password and a current code (or a recovery code). */
  async disableTwoFactor(userId: string, password: string, code: string, client: ClientInfo = {}): Promise<void> {
    const user = await this.requireUser(userId);
    if (!user.totpEnabledAt) throw new BadRequestException('Two-step verification is already off');
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      if (!this.passwordAttempts.tryHit(userId)) {
        throw new HttpException('Too many wrong attempts. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
      }
      throw new BadRequestException('Password is incorrect');
    }
    this.assertCodesAllowed(user.id);
    if (!(await this.useSecondFactor(user, code, client))) this.rejectCode(user.id);
    await this.usersService.update(user.id, { totpSecret: null, totpEnabledAt: null, totpLastUsedStep: null, totpRecoveryCodes: null });
    await this.log('auth.2fa_disabled', client, { userId: user.id });
  }

  /** Replaces every recovery code; needs a current authenticator code. */
  async regenerateRecoveryCodes(userId: string, code: string, client: ClientInfo = {}): Promise<{ recoveryCodes: string[] }> {
    const user = await this.requireUser(userId);
    if (!user.totpEnabledAt || !user.totpSecret) throw new BadRequestException('Two-step verification is off');
    this.assertCodesAllowed(user.id);
    const step = verifyTotp(user.totpSecret, code, user.totpLastUsedStep);
    if (step === null) await this.failCode(user.id, client);
    const recoveryCodes = generateRecoveryCodes();
    await this.usersService.update(user.id, { totpLastUsedStep: step, totpRecoveryCodes: recoveryCodes.map(hashRecoveryCode) });
    await this.log('auth.recovery_codes_regenerated', client, { userId: user.id });
    return { recoveryCodes };
  }

  /** Changes the password after checking the current one, and signs out every other session. */
  async changePassword(
    userId: string,
    sessionId: string,
    currentPassword: string,
    newPassword: string,
    client: ClientInfo = {},
  ): Promise<{ signedOut: number }> {
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
    const signedOut = await this.sessions.revokeOthers(user.id, sessionId);
    await this.log('auth.password_changed', client, { userId: user.id, detail: { signedOut } });
    return { signedOut };
  }

  /**
   * Accepts an authenticator code (not one already used) or an unused recovery code, records the use and
   * says which it was. Wrong codes count towards CODE_ATTEMPTS per account; callers check assertCodesAllowed first.
   */
  private async useSecondFactor(user: User, code: string, client: ClientInfo): Promise<'app' | 'recovery' | null> {
    if (!user.totpSecret) return null;
    const step = verifyTotp(user.totpSecret, code, user.totpLastUsedStep);
    if (step !== null) {
      await this.usersService.update(user.id, { totpLastUsedStep: step });
      return 'app';
    }
    const hash = hashRecoveryCode(code);
    const remaining = user.totpRecoveryCodes ?? [];
    if (/[a-z]/i.test(code) && remaining.includes(hash)) {
      const left = remaining.filter((h) => h !== hash);
      await this.usersService.update(user.id, { totpRecoveryCodes: left });
      await this.log('auth.recovery_code_used', client, { userId: user.id, detail: { left: left.length } });
      return 'recovery';
    }
    this.codeFailures.tryHit(user.id);
    await this.log('auth.code_failed', client, { userId: user.id });
    return null;
  }

  private assertCodesAllowed(userId: string) {
    if (this.codeFailures.isLimited(userId)) {
      throw new HttpException('Too many wrong codes. Please try again in 15 minutes.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  /** Counts and logs a wrong code, then refuses it. */
  private async failCode(userId: string, client: ClientInfo): Promise<never> {
    this.codeFailures.tryHit(userId);
    await this.log('auth.code_failed', client, { userId });
    this.rejectCode(userId);
  }

  /** Refuses a wrong code that has already been counted. */
  private rejectCode(userId: string): never {
    this.assertCodesAllowed(userId);
    throw new BadRequestException('That code didn’t work. Check your authenticator app and try again.');
  }

  private async assertNotBlocked(clientKey: string, client: ClientInfo, email?: string) {
    if (this.loginFailures.isLimited(clientKey)) {
      await this.log('auth.login_blocked', client, { email });
      throw new HttpException('Too many failed sign-in attempts. Please try again in 15 minutes.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private log(action: AuditAction, client: ClientInfo, extra: { userId?: string; email?: string; detail?: Record<string, unknown> } = {}) {
    return this.audit.record({ action, ip: client.ip, userAgent: client.userAgent, ...extra });
  }

  private async requireUser(userId: string): Promise<User> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();
    return user;
  }

  /** The name the authenticator app shows next to the code: the site's host, else "Portfolio". */
  private issuer(): string {
    try {
      return new URL(this.config.get<string>('SITE_URL') ?? '').hostname || 'Portfolio';
    } catch {
      return 'Portfolio';
    }
  }

  private async startSession(userId: string, email: string, client: ClientInfo) {
    const session = await this.sessions.create(userId, client.userAgent, client.ip);
    return {
      access_token: this.jwtService.sign({ sub: userId, email, sid: session.id }),
    };
  }
}