import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/user.module';
import { Session } from './session.entity';
import { SESSION_TTL_MS, SessionsService } from './sessions.service';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([Session]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'dev_only_jwt_secret_change_me'),
        signOptions: { expiresIn: SESSION_TTL_MS / 1000 },
      }),
    }),
  ],
  providers: [AuthService, SessionsService, JwtStrategy],
  controllers: [AuthController],
  exports: [PassportModule],
})
export class AuthModule {}
