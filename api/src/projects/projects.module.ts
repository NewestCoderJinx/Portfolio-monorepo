import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ProjectDailyStat } from './project-daily-stat.entity';
import { ProjectStatsService } from './project-stats.service';
import { Project } from './project.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectDailyStat]), AuthModule],
  providers: [ProjectsService, ProjectStatsService],
  controllers: [ProjectsController],
  exports: [ProjectsService],
})
export class ProjectsModule {}