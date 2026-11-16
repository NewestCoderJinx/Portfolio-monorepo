import { MigrationInterface, QueryRunner } from 'typeorm';

/** Authenticator-app two-step verification for admin sign-in. */
export class TwoFactor1794862770711 implements MigrationInterface {
  name = 'TwoFactor1794862770711';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD "totpSecret" character varying(64),
        ADD "totpEnabledAt" TIMESTAMP WITH TIME ZONE,
        ADD "totpLastUsedStep" integer,
        ADD "totpRecoveryCodes" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN "totpRecoveryCodes",
        DROP COLUMN "totpLastUsedStep",
        DROP COLUMN "totpEnabledAt",
        DROP COLUMN "totpSecret"
    `);
  }
}
