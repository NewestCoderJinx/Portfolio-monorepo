import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from '../profile/entities/profile.entity';
import { Project } from '../projects/project.entity';
import { ProjectsModule } from '../projects/projects.module';
import { ShareController } from './share.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Profile]), ProjectsModule],
  controllers: [ShareController],
})
export class ShareModule {}
