import { DataSourceOptions } from 'typeorm';
import { Session } from '../auth/session.entity';
import { Credential } from '../credentials/credential.entity';
import { InitialSchema1794771932836 } from '../migrations/1794771932836-InitialSchema';
import { TimestampsWithTimeZone1794772308676 } from '../migrations/1794772308676-TimestampsWithTimeZone';
import { Sessions1794862148003 } from '../migrations/1794862148003-Sessions';
import { Experience } from '../experience/experience.entity';
import { Message } from '../messages/message.entity';
import { Post } from '../posts/post.entity';
import { Profile } from '../profile/entities/profile.entity';
import { ProjectDailyStat } from '../projects/project-daily-stat.entity';
import { Project } from '../projects/project.entity';
import { Skill } from '../skills/skill.entity';
import { TestimonialRequest } from '../testimonials/requests/testimonial-request.entity';
import { Testimonial } from '../testimonials/testimonial.entity';
import { User } from '../users/user.entity';

/** Applied in this order. Add each new migration class here (see api/README.md). */
export const MIGRATIONS = [InitialSchema1794771932836, TimestampsWithTimeZone1794772308676, Sessions1794862148003];

export const ENTITIES = [Project, Profile, User, Experience, Message, Testimonial, Credential, Skill, ProjectDailyStat, TestimonialRequest, Post, Session];

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
    // The schema only changes through migrations, which the app runs at startup.
    synchronize: false,
    migrations: MIGRATIONS,
    migrationsRun: true,
  };
}
