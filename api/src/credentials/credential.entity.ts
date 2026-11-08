import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export const CREDENTIAL_KINDS = ['education', 'certification'] as const;
export type CredentialKind = (typeof CREDENTIAL_KINDS)[number];

/** A degree/course (education) or a certificate (certification). */
@Entity('credentials')
export class Credential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  kind: CredentialKind;

  /** Degree or certificate name, e.g. "BSc Computer Science" or "AWS Certified Developer". */
  @Column({ length: 150 })
  title: string;

  /** School or issuing organisation. */
  @Column({ length: 150 })
  institution: string;

  /** ISO date; mainly for education. */
  @Column({ type: 'date', nullable: true })
  startDate: string | null;

  /** Graduation or issue date. Null on education means still studying. */
  @Column({ type: 'date', nullable: true })
  endDate: string | null;

  /** Where the credential can be verified. */
  @Column({ type: 'varchar', nullable: true })
  credentialUrl: string | null;

  /** e.g. grade, honours or focus. */
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
