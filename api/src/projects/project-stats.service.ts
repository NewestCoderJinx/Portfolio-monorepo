import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { ProjectDailyStat } from './project-daily-stat.entity';

export interface Series {
  views: number[];
  shareClicks: number[];
}

/** Daily counts over a window, every array aligned with `days` (oldest first, UTC). */
export interface ProjectStats {
  days: string[];
  totals: Series;
  /** Only projects with at least one count in the window. */
  projects: Record<string, Series>;
}

export const MIN_DAYS = 7;
export const MAX_DAYS = 365;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The last `count` UTC dates as YYYY-MM-DD, ending today. */
export function lastDays(count: number, now = new Date()): string[] {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Array.from({ length: count }, (_, i) => new Date(today - (count - 1 - i) * DAY_MS).toISOString().slice(0, 10));
}

const emptySeries = (n: number): Series => ({ views: Array(n).fill(0), shareClicks: Array(n).fill(0) });

/** Spreads stored rows over the window, filling days without visits with zeros. */
export function buildStats(rows: Pick<ProjectDailyStat, 'projectId' | 'day' | 'views' | 'shareClicks'>[], days: string[]): ProjectStats {
  const index = new Map(days.map((d, i) => [d, i]));
  const totals = emptySeries(days.length);
  const projects: Record<string, Series> = {};
  for (const r of rows) {
    const i = index.get(String(r.day).slice(0, 10));
    if (i === undefined) continue;
    const series = (projects[r.projectId] ??= emptySeries(days.length));
    series.views[i] += r.views;
    series.shareClicks[i] += r.shareClicks;
    totals.views[i] += r.views;
    totals.shareClicks[i] += r.shareClicks;
  }
  return { days, totals, projects };
}

@Injectable()
export class ProjectStatsService {
  constructor(
    @InjectRepository(ProjectDailyStat)
    private readonly statRepository: Repository<ProjectDailyStat>,
  ) {}

  async forLastDays(count: number, now = new Date()): Promise<ProjectStats> {
    const n = Math.min(MAX_DAYS, Math.max(MIN_DAYS, Math.floor(count) || 30));
    const days = lastDays(n, now);
    const rows = await this.statRepository.find({ where: { day: MoreThanOrEqual(days[0]) } });
    return buildStats(rows, days);
  }
}
