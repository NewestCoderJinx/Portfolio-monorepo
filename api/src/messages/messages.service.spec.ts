import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessagesService } from './messages.service';

describe('MessagesService', () => {
  const repo = { create: vi.fn((m) => m), save: vi.fn(async (m) => m), findOne: vi.fn(), delete: vi.fn() };
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

  it('marks a message read and 404s on unknown ids', async () => {
    repo.findOne.mockResolvedValueOnce({ id: 'm1', read: false });
    await expect(service.setRead('m1', true)).resolves.toMatchObject({ read: true });
    repo.findOne.mockResolvedValueOnce(null);
    await expect(service.setRead('nope', true)).rejects.toBeInstanceOf(NotFoundException);
  });
});
