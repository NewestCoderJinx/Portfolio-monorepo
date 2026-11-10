import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Project } from './project.entity';

/** Per-project counts for one UTC day, for trend charts in Admin. */
@Entity('project_daily_stats')
export class ProjectDailyStat {
  @PrimaryColumn('uuid')
  projectId: string;

  /** YYYY-MM-DD, UTC. */
  @PrimaryColumn({ type: 'date' })
  day: string;

  @Column({ type: 'int', default: 0 })
  views: number;

  @Column({ type: 'int', default: 0 })
  shareClicks: number;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project?: Project;
}
