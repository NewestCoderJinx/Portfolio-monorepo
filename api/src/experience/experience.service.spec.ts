import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExperienceService } from './experience.service';

describe('ExperienceService', () => {
  const repo = {
    create: vi.fn((dto) => dto),
    save: vi.fn(async (e) => ({ id: 'e1', ...e })),
    preload: vi.fn(),
    delete: vi.fn(),
  };
  let service: ExperienceService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ExperienceService(repo as any);
  });

  it('creates a current role without an end date', async () => {
    await expect(service.create({ role: 'Engineer', company: 'Acme', startDate: '2024-01-01' })).resolves.toMatchObject({ id: 'e1' });
  });

  it('rejects an end date before the start date', async () => {
    await expect(
      service.create({ role: 'Engineer', company: 'Acme', startDate: '2024-05-01', endDate: '2023-01-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('checks the merged dates on update', async () => {
    repo.preload.mockResolvedValue({ id: 'e1', startDate: '2024-05-01', endDate: '2023-01-01' });
    await expect(service.update('e1', { endDate: '2023-01-01' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('404s when updating or deleting a missing entry', async () => {
    repo.preload.mockResolvedValue(undefined);
    await expect(service.update('nope', { role: 'x' })).rejects.toBeInstanceOf(NotFoundException);
    repo.delete.mockResolvedValue({ affected: 0 });
    await expect(service.remove('nope')).rejects.toBeInstanceOf(NotFoundException);
  });
});
