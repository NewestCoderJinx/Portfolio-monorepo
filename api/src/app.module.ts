import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsModule } from './projects/projects.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/user.module';
import { Project } from './projects/project.entity';
import { User } from './users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'postgres',
      port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgrespassword',
      database: process.env.DATABASE_NAME || 'portfoliodb',
      entities: [Project, User],
      synchronize: true,
    }),
    ProjectsModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}