import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from '../profile/entities/profile.entity';
import { Project } from '../projects/project.entity';
import { ShareController } from './share.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Profile])],
  controllers: [ShareController],
})
export class ShareModule {}
