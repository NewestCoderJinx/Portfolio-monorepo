import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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