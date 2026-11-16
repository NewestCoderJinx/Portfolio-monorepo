import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';

/**
 * One signed-in browser. Every access token names its session (the `sid` claim), and a token is only
 * accepted while its session row exists, so deleting the row signs that browser out.
 */
@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user?: User;

  /** The browser's User-Agent header, cut to fit, so the Account tab can say "Firefox on Linux". */
  @Column({ type: 'varchar', length: 300, nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  /** Updated at most once a minute while the session is used. */
  @Column({ type: 'timestamptz' })
  lastSeenAt: Date;

  /** Matches the access token's expiry; expired rows are cleared on the next sign-in. */
  @Column({ type: 'timestamptz' })
  expiresAt: Date;
}
