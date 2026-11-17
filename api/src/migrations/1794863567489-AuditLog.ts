import { MigrationInterface, QueryRunner } from 'typeorm';

/** The Admin activity log: sign-ins, security changes and content edits. */
export class AuditLog1794863567489 implements MigrationInterface {
  name = 'AuditLog1794863567489';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "audit_events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "action" character varying(64) NOT NULL,
        "userId" uuid,
        "email" character varying(200),
        "ip" character varying(64),
        "userAgent" character varying(300),
        "detail" jsonb,
        CONSTRAINT "PK_910f64d901a5c3e9878f0d4a407" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_7f51b93a1819ea59b9df7d9855" ON "audit_events" ("createdAt")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "audit_events"`);
  }
}
