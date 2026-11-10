import { DataSourceOptions } from 'typeorm';
import { Credential } from '../credentials/credential.entity';
import { Experience } from '../experience/experience.entity';
import { Message } from '../messages/message.entity';
import { Profile } from '../profile/entities/profile.entity';
import { ProjectDailyStat } from '../projects/project-daily-stat.entity';
import { Project } from '../projects/project.entity';
import { Skill } from '../skills/skill.entity';
import { Testimonial } from '../testimonials/testimonial.entity';
import { User } from '../users/user.entity';

export const ENTITIES = [Project, Profile, User, Experience, Message, Testimonial, Credential, Skill, ProjectDailyStat];

// Single source of truth for DB settings, shared by the app and the seed script.
export function databaseConfig(): DataSourceOptions {
  return {
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'portfolio_user',
    password: process.env.POSTGRES_PASSWORD || 'secret_password',
    database: process.env.POSTGRES_DB || 'portfolio_db',
    uuidExtension: 'pgcrypto',
    entities: ENTITIES,
    synchronize: process.env.NODE_ENV !== 'production' || process.env.DB_SYNCHRONIZE === 'true',
  };
}
