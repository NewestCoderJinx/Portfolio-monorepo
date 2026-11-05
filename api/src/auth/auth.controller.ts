import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';

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
}