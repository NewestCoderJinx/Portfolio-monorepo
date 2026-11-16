import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionsService } from './sessions.service';

describe('SessionsService', () => {
  const repo = { findOne: vi.fn(), update: vi.fn(), find: vi.fn(), delete: vi.fn(), create: vi.fn((x) => x), save: vi.fn(async (x) => ({ id: 's1', ...x })) };
  let service: SessionsService;
  const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);
  const inMinutes = (m: number) => new Date(Date.now() + m * 60_000);

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SessionsService(repo as any);
  });

  it('creates a session that expires in a day and trims long headers', async () => {
    const session = await service.create('u1', 'x'.repeat(500), '1.2.3.4');
    expect(repo.delete).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1' }));
    expect(session.userAgent).toHaveLength(300);
    expect(session.expiresAt.getTime() - session.lastSeenAt.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it('rejects a missing or expired session', async () => {
    repo.findOne.mockResolvedValueOnce(null);
    await expect(service.validate('s1', 'u1')).resolves.toBeNull();
    repo.findOne.mockResolvedValueOnce({ id: 's1', lastSeenAt: minutesAgo(10), expiresAt: minutesAgo(1) });
    await expect(service.validate('s1', 'u1')).resolves.toBeNull();
  });

  it('only writes lastSeenAt when it is a minute stale', async () => {
    repo.findOne.mockResolvedValueOnce({ id: 's1', lastSeenAt: new Date(), expiresAt: inMinutes(60) });
    await expect(service.validate('s1', 'u1')).resolves.toMatchObject({ id: 's1' });
    expect(repo.update).not.toHaveBeenCalled();
    repo.findOne.mockResolvedValueOnce({ id: 's1', lastSeenAt: minutesAgo(2), expiresAt: inMinutes(60) });
    await service.validate('s1', 'u1');
    expect(repo.update).toHaveBeenCalledOnce();
  });

  it('lists live sessions and marks the current one', async () => {
    repo.find.mockResolvedValue([
      { id: 's1', lastSeenAt: new Date(), createdAt: new Date(), expiresAt: inMinutes(60) },
      { id: 's2', lastSeenAt: new Date(), createdAt: new Date(), expiresAt: minutesAgo(1) },
      { id: 's3', lastSeenAt: new Date(), createdAt: new Date(), expiresAt: inMinutes(60) },
    ]);
    const list = await service.list('u1', 's3');
    expect(list.map((s) => [s.id, s.current])).toEqual([
      ['s1', false],
      ['s3', true],
    ]);
  });

  it('only revokes sessions belonging to the user', async () => {
    repo.delete.mockResolvedValueOnce({ affected: 0 });
    await expect(service.revoke('u1', 'other-users-session')).resolves.toBe(false);
    expect(repo.delete).toHaveBeenCalledWith({ userId: 'u1', id: 'other-users-session' });
  });
});
