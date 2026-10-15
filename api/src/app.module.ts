import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './projects/project.entity';
import { ProjectsModule } from './projects/projects.module';
import { Profile } from './profile/entities/profile.entity';
import { ProfileController } from './profile/profile.controller';
import { ProfileService } from './profile/profile.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      username: process.env.POSTGRES_USER || 'portfolio',
      password: process.env.POSTGRES_PASSWORD || 'development-password',
      database: process.env.POSTGRES_DB || 'portfolio',
      entities: [Project, Profile],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Project, Profile]),
    ProjectsModule,
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class AppModule {}