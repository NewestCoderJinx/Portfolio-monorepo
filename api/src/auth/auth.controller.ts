import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService, type ClientInfo } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthUser } from './jwt.strategy';
import { SessionsService } from './sessions.service';

/** The caller's IP (IPv4 shown plainly rather than as "::ffff:1.2.3.4") and browser. */
const clientInfo = (req: Request): ClientInfo => ({ ip: req.ip?.replace(/^::ffff:/, ''), userAgent: req.get('user-agent') });

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessions: SessionsService,
  ) {}

  @Get('registration-status')
  async registrationStatus() {
    return { open: await this.authService.isRegistrationOpen() };
  }

  @Post('register')
  register(@Body() dto: AuthCredentialsDto, @Req() req: Request) {
    return this.authService.register(dto.email, dto.password, clientInfo(req));
  }

  @Post('login')
  login(@Body() dto: AuthCredentialsDto, @Req() req: Request) {
    return this.authService.login(dto.email, dto.password, clientInfo(req));
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: Request) {
    return this.authService.me((req.user as AuthUser).userId);
  }

  /** Signs out every other session; this one continues. */
  @UseGuards(JwtAuthGuard)
  @Patch('password')
  changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    const { userId, sessionId } = req.user as AuthUser;
    return this.authService.changePassword(userId, sessionId, dto.currentPassword, dto.newPassword);
  }

  /** Ends the caller's own session. */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request) {
    const { userId, sessionId } = req.user as AuthUser;
    await this.sessions.revoke(userId, sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  listSessions(@Req() req: Request) {
    const { userId, sessionId } = req.user as AuthUser;
    return this.sessions.list(userId, sessionId);
  }

  /** Signs out every session except the caller's. */
  @UseGuards(JwtAuthGuard)
  @Delete('sessions')
  async revokeOtherSessions(@Req() req: Request) {
    const { userId, sessionId } = req.user as AuthUser;
    return { signedOut: await this.sessions.revokeOthers(userId, sessionId) };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:id')
  @HttpCode(204)
  async revokeSession(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string) {
    if (!(await this.sessions.revoke((req.user as AuthUser).userId, id))) {
      throw new NotFoundException('Session not found');
    }
  }
}
