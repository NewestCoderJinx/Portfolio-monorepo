import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** A private, single-use link that lets someone write a testimonial without logging in. */
@Entity('testimonial_requests')
export class TestimonialRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** The secret part of the link; random and unguessable. */
  @Index({ unique: true })
  @Column({ length: 64 })
  token: string;

  /** Who it's for, to prefill the form and label it in Admin. */
  @Column({ type: 'varchar', length: 100, nullable: true })
  recipientName: string | null;

  /** A short personal note shown at the top of the form. */
  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  /** Set when the testimonial is submitted; the link stops working. */
  @Column({ type: 'timestamptz', nullable: true })
  usedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  testimonialId: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
