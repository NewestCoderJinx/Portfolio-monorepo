import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { isUUID } from 'class-validator';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/user.service';

export interface AuthUser {
  userId: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'dev_only_jwt_secret_change_me'),
    });
  }

  /** Beyond the signature: the account must still exist, and the token must postdate the last password change. */
  async validate(payload: { sub: string; email: string; iat?: number }): Promise<AuthUser> {
    // A non-uuid sub would make Postgres throw (a 500), so treat it as unknown.
    const user = isUUID(payload?.sub) ? await this.usersService.findById(payload.sub) : null;
    if (!user) {
      throw new UnauthorizedException();
    }
    if (isRevoked(payload.iat, user.passwordChangedAt)) {
      throw new UnauthorizedException('Session ended by a password change');
    }
    return { userId: user.id, email: user.email };
  }
}

/** True when the token was issued before the password was last changed. */
export function isRevoked(iat: number | undefined, passwordChangedAt: Date | null): boolean {
  if (!passwordChangedAt) return false;
  return iat === undefined || iat * 1000 < passwordChangedAt.getTime();
}
