import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** One role on the developer's work history timeline. */
@Entity('experiences')
export class Experience {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  role: string;

  @Column()
  company: string;

  @Column({ nullable: true })
  location: string;

  /** ISO date (YYYY-MM-DD); only the month and year are shown. */
  @Column({ type: 'date' })
  startDate: string;

  /** Null means this is a current role. */
  @Column({ type: 'date', nullable: true })
  endDate: string | null;

  /** Free text; each line is shown as a bullet point. */
  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('simple-array', { nullable: true })
  skills: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
