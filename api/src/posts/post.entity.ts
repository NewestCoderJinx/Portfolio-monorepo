import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  /** URL part of /blog/<slug>. Unique; only changes when edited on purpose, so shared links keep working. */
  @Column({ unique: true })
  slug: string;

  /** Short summary for the post list and link previews. */
  @Column({ type: 'text', nullable: true })
  excerpt: string | null;

  /** Markdown. */
  @Column({ type: 'text', default: '' })
  body: string;

  @Column({ nullable: true })
  coverImageUrl: string | null;

  @Column('simple-array', { nullable: true })
  tags: string[] | null;

  /** Drafts are only visible in Admin. */
  @Column({ default: false })
  published: boolean;

  /** Set the first time the post is published; kept if it's unpublished and published again. */
  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
