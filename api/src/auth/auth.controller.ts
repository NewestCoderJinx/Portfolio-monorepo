import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new admin user' })
  register(@Body() credentialsDto: AuthCredentialsDto) {
    return this.authService.register(credentialsDto.email, credentialsDto.password);
  }

  @Post('login')
  @ApiOperation({ summary: 'User login to receive JWT token' })
  login(@Body() credentialsDto: AuthCredentialsDto) {
    return this.authService.login(credentialsDto.email, credentialsDto.password);
  }
}