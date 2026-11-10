import { describe, expect, it, vi } from 'vitest';
import { buildStats, lastDays, ProjectStatsService } from './project-stats.service';

describe('lastDays', () => {
  it('ends today in UTC and is oldest first, across month ends', () => {
    expect(lastDays(3, new Date('2026-03-01T23:30:00Z'))).toEqual(['2026-02-27', '2026-02-28', '2026-03-01']);
  });
});

describe('buildStats', () => {
  const days = ['2026-11-08', '2026-11-09', '2026-11-10'];

  it('aligns rows to the days, fills gaps with zeros and sums totals', () => {
    const stats = buildStats(
      [
        { projectId: 'a', day: '2026-11-08', views: 2, shareClicks: 1 },
        { projectId: 'a', day: '2026-11-10', views: 1, shareClicks: 0 },
        { projectId: 'b', day: '2026-11-10', views: 4, shareClicks: 3 },
      ],
      days,
    );
    expect(stats.projects.a).toEqual({ views: [2, 0, 1], shareClicks: [1, 0, 0] });
    expect(stats.projects.b).toEqual({ views: [0, 0, 4], shareClicks: [0, 0, 3] });
    expect(stats.totals).toEqual({ views: [2, 0, 5], shareClicks: [1, 0, 3] });
  });

  it('ignores rows outside the window', () => {
    const stats = buildStats([{ projectId: 'a', day: '2026-01-01', views: 9, shareClicks: 9 }], days);
    expect(stats.projects).toEqual({});
    expect(stats.totals.views).toEqual([0, 0, 0]);
  });
});

describe('ProjectStatsService', () => {
  it('clamps the window and only loads rows inside it', async () => {
    const repo = { find: vi.fn().mockResolvedValue([]) };
    const service = new ProjectStatsService(repo as any);
    const now = new Date('2026-11-10T12:00:00Z');
    expect((await service.forLastDays(2, now)).days).toHaveLength(7);
    expect((await service.forLastDays(10_000, now)).days).toHaveLength(365);
    const stats = await service.forLastDays(30, now);
    expect(stats.days[0]).toBe('2026-10-12');
    expect(repo.find).toHaveBeenLastCalledWith({ where: { day: expect.objectContaining({ _value: '2026-10-12' }) } });
  });
});
