import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthUser } from './jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('registration-status')
  async registrationStatus() {
    return { open: await this.authService.isRegistrationOpen() };
  }

  @Post('register')
  register(@Body() dto: AuthCredentialsDto) {
    return this.authService.register(dto.email, dto.password);
  }

  @Post('login')
  login(@Body() dto: AuthCredentialsDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: Request) {
    return this.authService.me((req.user as AuthUser).userId);
  }

  /** Returns a new access token; all other logins stop working. */
  @UseGuards(JwtAuthGuard)
  @Patch('password')
  changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword((req.user as AuthUser).userId, dto.currentPassword, dto.newPassword);
  }
}