import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** A skill shown on the public page and résumé, optionally grouped by category. */
@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** e.g. "TypeScript". Unique, ignoring case. */
  @Column({ length: 60 })
  name: string;

  /** e.g. "Languages" or "Tools". Skills without one are grouped as "Other". */
  @Column({ type: 'varchar', length: 60, nullable: true })
  category: string | null;

  /** Manual position; lower comes first. */
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
