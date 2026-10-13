import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  async getProfile(): Promise<Profile> {
    const profile = await this.profileRepository.findOne({ where: {} });
    if (!profile) {
      throw new NotFoundException('Developer profile not found');
    }
    return profile;
  }

  async updateProfile(updateData: Partial<Profile>): Promise<Profile> {
    let profile = await this.profileRepository.findOne({ where: {} });
    if (!profile) {
      profile = this.profileRepository.create(updateData);
    } else {
      Object.assign(profile, updateData);
    }
    return this.profileRepository.save(profile);
  }
}