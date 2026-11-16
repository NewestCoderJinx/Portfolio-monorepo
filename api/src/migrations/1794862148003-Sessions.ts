import { MigrationInterface, QueryRunner } from 'typeorm';

/** One row per signed-in browser, so sessions can be listed and signed out from the Admin Account tab. */
export class Sessions1794862148003 implements MigrationInterface {
  name = 'Sessions1794862148003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "userAgent" character varying(300),
        "ip" character varying(64),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "lastSeenAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_57de40bc620f456c7311aa3a1e" ON "sessions" ("userId")`);
    await queryRunner.query(`
      ALTER TABLE "sessions" ADD CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "sessions"`);
  }
}
