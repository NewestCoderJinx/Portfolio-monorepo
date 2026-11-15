import { MigrationInterface, QueryRunner } from 'typeorm';

interface Table {
  name: string;
  /** Column definitions, as TypeORM generated them. */
  columns: string[];
  /** Primary key and unique constraints. */
  constraints: string[];
}

/** The schema as it stood when migrations were introduced (November 2026). */
const TABLES: Table[] = [
  {
    name: 'credentials',
    columns: [
      '"id" uuid NOT NULL DEFAULT gen_random_uuid()',
      '"kind" character varying(20) NOT NULL',
      '"title" character varying(150) NOT NULL',
      '"institution" character varying(150) NOT NULL',
      '"startDate" date',
      '"endDate" date',
      '"credentialUrl" character varying',
      '"description" text',
      '"createdAt" TIMESTAMP NOT NULL DEFAULT now()',
      '"updatedAt" TIMESTAMP NOT NULL DEFAULT now()',
    ],
    constraints: ['CONSTRAINT "PK_1e38bc43be6697cdda548ad27a6" PRIMARY KEY ("id")'],
  },
  {
    name: 'experiences',
    columns: [
      '"id" uuid NOT NULL DEFAULT gen_random_uuid()',
      '"role" character varying NOT NULL',
      '"company" character varying NOT NULL',
      '"location" character varying',
      '"startDate" date NOT NULL',
      '"endDate" date',
      '"description" text',
      '"skills" text',
      '"createdAt" TIMESTAMP NOT NULL DEFAULT now()',
      '"updatedAt" TIMESTAMP NOT NULL DEFAULT now()',
    ],
    constraints: ['CONSTRAINT "PK_884f0913a63882712ea578e7c85" PRIMARY KEY ("id")'],
  },
  {
    name: 'messages',
    columns: [
      '"id" uuid NOT NULL DEFAULT gen_random_uuid()',
      '"name" character varying(100) NOT NULL',
      '"email" character varying(200) NOT NULL',
      '"body" text NOT NULL',
      '"read" boolean NOT NULL DEFAULT false',
      '"archived" boolean NOT NULL DEFAULT false',
      '"repliedAt" TIMESTAMP WITH TIME ZONE',
      '"createdAt" TIMESTAMP NOT NULL DEFAULT now()',
    ],
    constraints: ['CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id")'],
  },
  {
    name: 'posts',
    columns: [
      '"id" uuid NOT NULL DEFAULT gen_random_uuid()',
      '"title" character varying NOT NULL',
      '"slug" character varying NOT NULL',
      '"excerpt" text',
      '"body" text NOT NULL DEFAULT \'\'',
      '"coverImageUrl" character varying',
      '"tags" text',
      '"published" boolean NOT NULL DEFAULT false',
      '"publishedAt" TIMESTAMP WITH TIME ZONE',
      '"createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()',
      '"updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()',
    ],
    constraints: ['CONSTRAINT "UQ_54ddf9075260407dcfdd7248577" UNIQUE ("slug")', 'CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id")'],
  },
  {
    name: 'profiles',
    columns: [
      '"id" uuid NOT NULL DEFAULT gen_random_uuid()',
      '"name" character varying NOT NULL',
      '"headline" character varying',
      '"bio" text',
      '"location" character varying',
      '"email" character varying',
      '"avatarUrl" character varying',
      '"websiteUrl" character varying',
      '"githubUrl" character varying',
      '"linkedinUrl" character varying',
      '"availability" character varying',
      '"resumeUrl" character varying',
      '"createdAt" TIMESTAMP NOT NULL DEFAULT now()',
      '"updatedAt" TIMESTAMP NOT NULL DEFAULT now()',
    ],
    constraints: ['CONSTRAINT "PK_8e520eb4da7dc01d0e190447c8e" PRIMARY KEY ("id")'],
  },
  {
    name: 'projects',
    columns: [
      '"id" uuid NOT NULL DEFAULT gen_random_uuid()',
      '"title" character varying NOT NULL',
      '"description" character varying',
      '"problem" text',
      '"solution" text',
      '"challenges" text',
      '"decisions" text',
      '"lessonsLearned" text',
      '"imageUrl" character varying',
      '"tags" text',
      '"githubUrl" character varying',
      '"demoUrl" character varying',
      '"gallery" text',
      '"featured" boolean NOT NULL DEFAULT false',
      '"published" boolean NOT NULL DEFAULT true',
      '"views" integer NOT NULL DEFAULT \'0\'',
      '"shareClicks" integer NOT NULL DEFAULT \'0\'',
      '"sortOrder" integer NOT NULL DEFAULT \'0\'',
      '"createdAt" TIMESTAMP NOT NULL DEFAULT now()',
      '"updatedAt" TIMESTAMP NOT NULL DEFAULT now()',
    ],
    constraints: ['CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id")'],
  },
  {
    name: 'project_daily_stats',
    columns: [
      '"projectId" uuid NOT NULL',
      '"day" date NOT NULL',
      '"views" integer NOT NULL DEFAULT \'0\'',
      '"shareClicks" integer NOT NULL DEFAULT \'0\'',
    ],
    constraints: ['CONSTRAINT "PK_544367bcc44366a494028a38bae" PRIMARY KEY ("projectId", "day")'],
  },
  {
    name: 'skills',
    columns: [
      '"id" uuid NOT NULL DEFAULT gen_random_uuid()',
      '"name" character varying(60) NOT NULL',
      '"category" character varying(60)',
      '"sortOrder" integer NOT NULL DEFAULT \'0\'',
      '"createdAt" TIMESTAMP NOT NULL DEFAULT now()',
      '"updatedAt" TIMESTAMP NOT NULL DEFAULT now()',
    ],
    constraints: ['CONSTRAINT "PK_0d3212120f4ecedf90864d7e298" PRIMARY KEY ("id")'],
  },
  {
    name: 'testimonial_requests',
    columns: [
      '"id" uuid NOT NULL DEFAULT gen_random_uuid()',
      '"token" character varying(64) NOT NULL',
      '"recipientName" character varying(100)',
      '"note" text',
      '"expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL',
      '"usedAt" TIMESTAMP WITH TIME ZONE',
      '"testimonialId" uuid',
      '"createdAt" TIMESTAMP NOT NULL DEFAULT now()',
    ],
    constraints: ['CONSTRAINT "PK_e2338553017562a4ecc15795af9" PRIMARY KEY ("id")'],
  },
  {
    name: 'testimonials',
    columns: [
      '"id" uuid NOT NULL DEFAULT gen_random_uuid()',
      '"name" character varying(100) NOT NULL',
      '"role" character varying(120)',
      '"company" character varying(120)',
      '"quote" text NOT NULL',
      '"avatarUrl" character varying',
      '"linkUrl" character varying',
      '"submitted" boolean NOT NULL DEFAULT false',
      '"published" boolean NOT NULL DEFAULT true',
      '"createdAt" TIMESTAMP NOT NULL DEFAULT now()',
      '"updatedAt" TIMESTAMP NOT NULL DEFAULT now()',
    ],
    constraints: ['CONSTRAINT "PK_63b03c608bd258f115a0a4a1060" PRIMARY KEY ("id")'],
  },
  {
    name: 'users',
    columns: [
      '"id" uuid NOT NULL DEFAULT gen_random_uuid()',
      '"email" character varying NOT NULL',
      '"passwordHash" character varying NOT NULL',
      '"passwordChangedAt" TIMESTAMP WITH TIME ZONE',
      '"createdAt" TIMESTAMP NOT NULL DEFAULT now()',
    ],
    constraints: ['CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")', 'CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")'],
  },
];

const INDEXES = [
  'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_269a636b84025bf3c72f298090" ON "testimonial_requests" ("token")',
];

/** [table, constraint name, definition] */
const FOREIGN_KEYS: [string, string, string][] = [
  ['project_daily_stats', 'FK_97741c6eac0b785a4ba21205880', 'FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION'],
];

/**
 * The starting schema. Before this, TypeORM's synchronize option created and changed tables at startup,
 * so a database that already exists may be at any earlier version. Every statement here therefore only
 * adds what is missing (tables, columns, indexes, foreign keys) and never drops or changes anything:
 * on a new database it builds the whole schema, and on an existing one it fills the gaps.
 */
export class InitialSchema1794771932836 implements MigrationInterface {
  name = 'InitialSchema1794771932836';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      const body = [...table.columns, ...table.constraints].join(', ');
      await queryRunner.query(`CREATE TABLE IF NOT EXISTS "${table.name}" (${body})`);
      // Tables made by an older version may lack columns added since.
      for (const column of table.columns) {
        await queryRunner.query(`ALTER TABLE "${table.name}" ADD COLUMN IF NOT EXISTS ${column}`);
      }
    }
    for (const index of INDEXES) {
      await queryRunner.query(index);
    }
    for (const [table, name, definition] of FOREIGN_KEYS) {
      const exists = await queryRunner.query(`SELECT 1 FROM pg_constraint WHERE conname = $1`, [name]);
      if (exists.length === 0) {
        await queryRunner.query(`ALTER TABLE "${table}" ADD CONSTRAINT "${name}" ${definition}`);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "project_daily_stats" DROP CONSTRAINT IF EXISTS "FK_97741c6eac0b785a4ba21205880"');
    await queryRunner.query('DROP TABLE IF EXISTS "users"');
    await queryRunner.query('DROP TABLE IF EXISTS "testimonials"');
    await queryRunner.query('DROP INDEX IF EXISTS "public"."IDX_269a636b84025bf3c72f298090"');
    await queryRunner.query('DROP TABLE IF EXISTS "testimonial_requests"');
    await queryRunner.query('DROP TABLE IF EXISTS "skills"');
    await queryRunner.query('DROP TABLE IF EXISTS "project_daily_stats"');
    await queryRunner.query('DROP TABLE IF EXISTS "projects"');
    await queryRunner.query('DROP TABLE IF EXISTS "profiles"');
    await queryRunner.query('DROP TABLE IF EXISTS "posts"');
    await queryRunner.query('DROP TABLE IF EXISTS "messages"');
    await queryRunner.query('DROP TABLE IF EXISTS "experiences"');
    await queryRunner.query('DROP TABLE IF EXISTS "credentials"');
  }
}
