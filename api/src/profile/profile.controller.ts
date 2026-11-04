import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { Profile } from './entities/profile.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getProfile(): Promise<Profile> {
    return this.profileService.getProfile();
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  updateProfile(@Body() updateData: Partial<Profile>): Promise<Profile> {
    return this.profileService.updateProfile(updateData);
  }
}