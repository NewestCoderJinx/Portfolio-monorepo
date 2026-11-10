import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** A quote from a client, manager or colleague, shown on the public page. */
@Entity('testimonials')
export class Testimonial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  /** e.g. "Engineering Manager" */
  @Column({ type: 'varchar', length: 120, nullable: true })
  role: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  company: string | null;

  @Column({ type: 'text' })
  quote: string;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl: string | null;

  /** Where visitors can verify the person, e.g. their LinkedIn profile. */
  @Column({ type: 'varchar', nullable: true })
  linkUrl: string | null;

  /** True when the person wrote it through a request link; such testimonials start hidden, awaiting approval. */
  @Column({ default: false })
  submitted: boolean;

  /** Hidden testimonials stay in Admin only. */
  @Column({ default: true })
  published: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
