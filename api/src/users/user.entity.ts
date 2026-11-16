import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  /** Shown on the Admin Account tab. Changing the password also signs out every other session. */
  @Column({ type: 'timestamptz', nullable: true })
  passwordChangedAt: Date | null;

  /**
   * Authenticator-app secret (base32). Set while 2FA is being turned on; it only guards sign-in once
   * totpEnabledAt is set too.
   */
  @Column({ type: 'varchar', length: 64, nullable: true })
  totpSecret: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  totpEnabledAt: Date | null;

  /** The 30-second step of the last accepted code, so the same code can't be used twice. */
  @Column({ type: 'integer', nullable: true })
  totpLastUsedStep: number | null;

  /** SHA-256 hashes of the unused recovery codes. */
  @Column({ type: 'jsonb', nullable: true })
  totpRecoveryCodes: string[] | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}