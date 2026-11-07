import { Body, Controller, Get, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { uploadedFileUrl, uploadOptions } from '../common/uploads';
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

  /** Stores a résumé PDF and returns its public URL; saving it to the profile is a separate PATCH. */
  @UseGuards(JwtAuthGuard)
  @Post('resume')
  @UseInterceptors(
    FileInterceptor('file', uploadOptions({ maxBytes: 10 * 1024 * 1024, mimeTypes: /^application\/pdf$/, error: 'Only PDF files are allowed' })),
  )
  uploadResume(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    return { url: uploadedFileUrl(req, file) };
  }
}
