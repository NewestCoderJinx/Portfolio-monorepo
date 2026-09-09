import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy.js';
import { UsersModule } from '../../users/users.module.js';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: 'SUPER_SECRET_KEY_CHANGE_IN_PROD',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [JwtStrategy],
})
export class AuthModule {}