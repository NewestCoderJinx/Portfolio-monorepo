import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessagesService } from './messages.service';

describe('MessagesService', () => {
  const repo = { create: vi.fn((m) => m), save: vi.fn(async (m) => m), findOne: vi.fn(), delete: vi.fn(), update: vi.fn() };
  let service: MessagesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MessagesService(repo as any);
  });

  it('stores a trimmed message', async () => {
    await service.receive({ name: ' Ada ', email: 'ada@example.com ', body: '  Hello, I have a role for you.  ' });
    expect(repo.save).toHaveBeenCalledWith({ name: 'Ada', email: 'ada@example.com', body: 'Hello, I have a role for you.' });
  });

  it('silently drops honeypot submissions', async () => {
    await service.receive({ name: 'Bot', email: 'bot@spam.com', body: 'Buy cheap stuff now!!', website: 'http://spam' });
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('updates only the flags given and 404s on unknown ids', async () => {
    repo.findOne.mockResolvedValueOnce({ id: 'm1', read: false, archived: false, repliedAt: null });
    await expect(service.update('m1', { archived: true })).resolves.toEqual({ id: 'm1', read: false, archived: true, repliedAt: null });
    repo.findOne.mockResolvedValueOnce(null);
    await expect(service.update('nope', { read: true })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('records a reply once, marks the message read, and can clear it', async () => {
    const first = new Date('2026-01-01T10:00:00Z');
    repo.findOne.mockResolvedValueOnce({ id: 'm1', read: false, repliedAt: null });
    const replied = await service.update('m1', { replied: true });
    expect(replied.read).toBe(true);
    expect(replied.repliedAt).toBeInstanceOf(Date);

    repo.findOne.mockResolvedValueOnce({ id: 'm1', read: true, repliedAt: first });
    await expect(service.update('m1', { replied: true })).resolves.toMatchObject({ repliedAt: first });

    repo.findOne.mockResolvedValueOnce({ id: 'm1', read: true, repliedAt: first });
    await expect(service.update('m1', { replied: false })).resolves.toMatchObject({ repliedAt: null });
  });

  it('marks only unread, non-archived messages read in bulk', async () => {
    repo.update.mockResolvedValueOnce({ affected: 3 });
    await expect(service.markAllRead()).resolves.toBe(3);
    expect(repo.update).toHaveBeenCalledWith({ read: false, archived: false }, { read: true });
  });
});
