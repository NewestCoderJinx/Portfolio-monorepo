import { DataSourceOptions } from 'typeorm';
import { AuditEvent } from '../audit/audit-event.entity';
import { Session } from '../auth/session.entity';
import { Credential } from '../credentials/credential.entity';
import { InitialSchema1794771932836 } from '../migrations/1794771932836-InitialSchema';
import { TimestampsWithTimeZone1794772308676 } from '../migrations/1794772308676-TimestampsWithTimeZone';
import { Sessions1794862148003 } from '../migrations/1794862148003-Sessions';
import { TwoFactor1794862770711 } from '../migrations/1794862770711-TwoFactor';
import { AuditLog1794863567489 } from '../migrations/1794863567489-AuditLog';
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
export const MIGRATIONS = [InitialSchema1794771932836, TimestampsWithTimeZone1794772308676, Sessions1794862148003, TwoFactor1794862770711, AuditLog1794863567489];

export const ENTITIES = [Project, Profile, User, Experience, Message, Testimonial, Credential, Skill, ProjectDailyStat, TestimonialRequest, Post, Session, AuditEvent];

// Single source of truth for DB settings, shared by the app and the seed script.
// DATABASE_URL (e.g. from a hosted Postgres like Neon, with ?sslmode=require) wins over the POSTGRES_* settings.
export function databaseConfig(): DataSourceOptions {
  const url = process.env.DATABASE_URL?.trim() || undefined;
  return {
    type: 'postgres',
    url,
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
