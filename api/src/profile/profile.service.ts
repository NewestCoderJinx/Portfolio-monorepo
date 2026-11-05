import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from './entities/profile.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  // The site has a single developer profile: always use the oldest row.
  private findCurrent(): Promise<Profile | null> {
    return this.profileRepository.findOne({ where: {}, order: { createdAt: 'ASC' } });
  }

  async getProfile(): Promise<Profile> {
    const profile = await this.findCurrent();
    if (!profile) {
      throw new NotFoundException('Developer profile not found');
    }
    return profile;
  }

  async updateProfile(dto: UpdateProfileDto): Promise<Profile> {
    let profile = await this.findCurrent();
    if (!profile) {
      if (!dto.name?.trim()) {
        throw new BadRequestException('name is required when creating the profile');
      }
      profile = this.profileRepository.create();
    }
    Object.assign(profile, dto);
    return this.profileRepository.save(profile);
  }
}
