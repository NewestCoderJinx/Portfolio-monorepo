import { MigrationInterface, QueryRunner } from 'typeorm';

/** createdAt / updatedAt columns that were stored without a time zone. */
const COLUMNS: [table: string, column: string][] = [
  ['credentials', 'createdAt'],
  ['credentials', 'updatedAt'],
  ['experiences', 'createdAt'],
  ['experiences', 'updatedAt'],
  ['messages', 'createdAt'],
  ['profiles', 'createdAt'],
  ['profiles', 'updatedAt'],
  ['projects', 'createdAt'],
  ['projects', 'updatedAt'],
  ['skills', 'createdAt'],
  ['skills', 'updatedAt'],
  ['testimonial_requests', 'createdAt'],
  ['testimonials', 'createdAt'],
  ['testimonials', 'updatedAt'],
  ['users', 'createdAt'],
];

/**
 * Stores createdAt / updatedAt with their time zone (timestamptz), like every other date in the schema.
 *
 * Postgres filled these columns itself (DEFAULT now() and CURRENT_TIMESTAMP), so existing values are wall
 * times in the database's own TimeZone setting; "AT TIME ZONE current_setting('TimeZone')" reads them that
 * way, so every value keeps the instant it was recorded. Without the time zone, Node read them as its own
 * local time, which put them hours off whenever the API and the database ran in different zones.
 *
 * Converted in place rather than with TypeORM's generated drop-and-add, which would reset every date.
 * Columns that are already timestamptz are left alone.
 */
export class TimestampsWithTimeZone1794772308676 implements MigrationInterface {
  name = 'TimestampsWithTimeZone1794772308676';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [table, column] of COLUMNS) {
      if ((await this.typeOf(queryRunner, table, column)) === 'timestamp without time zone') {
        await queryRunner.query(
          `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE timestamptz USING "${column}" AT TIME ZONE current_setting('TimeZone')`,
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [table, column] of COLUMNS) {
      if ((await this.typeOf(queryRunner, table, column)) === 'timestamp with time zone') {
        await queryRunner.query(
          `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE timestamp USING "${column}" AT TIME ZONE current_setting('TimeZone')`,
        );
      }
    }
  }

  private async typeOf(queryRunner: QueryRunner, table: string, column: string): Promise<string | undefined> {
    const rows: { data_type: string }[] = await queryRunner.query(
      `SELECT data_type FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1 AND column_name = $2`,
      [table, column],
    );
    return rows[0]?.data_type;
  }
}
