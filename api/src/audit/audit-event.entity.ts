import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** Security events, e.g. sign-ins and 2FA changes (see AuditAction); content edits use 'content.change'. */
export type AuditAction =
  | 'auth.register'
  | 'auth.login'
  | 'auth.login_failed'
  | 'auth.login_blocked'
  | 'auth.code_failed'
  | 'auth.recovery_code_used'
  | 'auth.logout'
  | 'auth.password_changed'
  | 'auth.session_revoked'
  | 'auth.other_sessions_revoked'
  | 'auth.2fa_enabled'
  | 'auth.2fa_disabled'
  | 'auth.recovery_codes_regenerated'
  | 'content.change';

/** One line in the Admin activity log. Kept for AUDIT_RETENTION_DAYS. */
@Entity('audit_events')
export class AuditEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'varchar', length: 64 })
  action: AuditAction;

  /** The signed-in user, if any. Not a foreign key, so the log outlives the account. */
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  /** For sign-in attempts: the email that was typed, which may not be an account. */
  @Column({ type: 'varchar', length: 200, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  userAgent: string | null;

  /** Extra facts, e.g. { method, route, id, label } for content changes. Never secrets. */
  @Column({ type: 'jsonb', nullable: true })
  detail: Record<string, unknown> | null;
}
