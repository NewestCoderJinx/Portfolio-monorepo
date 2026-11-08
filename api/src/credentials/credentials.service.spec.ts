import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CredentialsService } from './credentials.service';

describe('CredentialsService', () => {
  const repo = {
    create: vi.fn((c) => c),
    save: vi.fn(async (c) => ({ id: 'c1', ...c })),
    preload: vi.fn(),
    delete: vi.fn(),
  };
  let service: CredentialsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CredentialsService(repo as any);
  });

  it('trims text and stores blank optional fields as null', async () => {
    await service.create({ kind: 'certification', title: ' AWS Developer ', institution: ' Amazon ', description: '  ', endDate: '2025-03-01' });
    expect(repo.save).toHaveBeenCalledWith({ kind: 'certification', title: 'AWS Developer', institution: 'Amazon', description: null, endDate: '2025-03-01' });
  });

  it('rejects an end date before the start date, including after an update', async () => {
    await expect(
      service.create({ kind: 'education', title: 'BSc', institution: 'Uni', startDate: '2024-09-01', endDate: '2020-06-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    repo.preload.mockResolvedValue({ id: 'c1', startDate: '2024-09-01', endDate: '2020-06-01' });
    await expect(service.update('c1', { endDate: '2020-06-01' })).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('404s on unknown ids', async () => {
    repo.preload.mockResolvedValue(undefined);
    await expect(service.update('nope', { title: 'x' })).rejects.toBeInstanceOf(NotFoundException);
    repo.delete.mockResolvedValue({ affected: 0 });
    await expect(service.remove('nope')).rejects.toBeInstanceOf(NotFoundException);
  });
});
