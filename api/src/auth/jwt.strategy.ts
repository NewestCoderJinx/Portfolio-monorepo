import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { isUUID } from 'class-validator';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/user.service';
import { SessionsService } from './sessions.service';

export interface AuthUser {
  userId: string;
  email: string;
  sessionId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
    private readonly sessions: SessionsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'dev_only_jwt_secret_change_me'),
    });
  }

  /** Beyond the signature: the account must still exist and the token's session must still be live. */
  async validate(payload: { sub?: string; email?: string; sid?: string }): Promise<AuthUser> {
    // A non-uuid id would make Postgres throw (a 500), so treat it as unknown.
    // Tokens from before sessions existed have no sid and are refused, which just means signing in again.
    if (!isUUID(payload?.sub) || !isUUID(payload?.sid)) throw new UnauthorizedException();
    const user = await this.usersService.findById(payload.sub!);
    if (!user) throw new UnauthorizedException();
    if (!(await this.sessions.validate(payload.sid!, user.id))) {
      throw new UnauthorizedException('This session has been signed out');
    }
    return { userId: user.id, email: user.email, sessionId: payload.sid! };
  }
}
