import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  problem: string;

  @Column({ type: 'text', nullable: true })
  solution: string;

  @Column({ type: 'text', nullable: true })
  challenges: string;

  @Column({ type: 'text', nullable: true })
  decisions: string;

  @Column({ type: 'text', nullable: true })
  lessonsLearned: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ nullable: true })
  githubUrl: string;

  @Column({ nullable: true })
  demoUrl: string;

  /** Extra screenshots shown in the case study. JSON, because URLs may contain commas. */
  @Column('simple-json', { nullable: true })
  gallery: string[] | null;

  /** Featured projects are pinned above all others. */
  @Column({ default: false })
  featured: boolean;

  /** Drafts are only visible in Admin. */
  @Column({ default: true })
  published: boolean;

  /** Manual position; lower comes first. */
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}