import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from './entities/profile.entity';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getProfile(): Promise<Profile> {
    return this.profileService.getProfile();
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  updateProfile(@Body() dto: UpdateProfileDto): Promise<Profile> {
    return this.profileService.updateProfile(dto);
  }
}
