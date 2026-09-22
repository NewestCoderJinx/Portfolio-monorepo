import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/projects/auth/auth.module.ts';
import { UsersModule } from './modules/users/users.module.js';
import { Project } from './modules/projects/project.entity';
import { User } from './modules/users/user.entity.js';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'your_password',
      database: 'portfolio',
      entities: [Project, User],
      synchronize: true, // Auto sync schema in development
    }),
    ProjectsModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}