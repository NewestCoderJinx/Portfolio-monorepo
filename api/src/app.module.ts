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
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '12345',
      database: 'portfolio',
      entities: [Project, User],
      synchronize: true,
    }),
    ProjectsModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}