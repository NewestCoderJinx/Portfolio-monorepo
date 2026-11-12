import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  const repo = {
    findOne: vi.fn(),
    create: vi.fn(() => ({})),
    save: vi.fn(async (p) => ({ id: 'p1', ...p })),
  };
  let service: ProfileService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProfileService(repo as any);
  });

  it('always reads the oldest profile row', async () => {
    repo.findOne.mockResolvedValue({ id: 'p1', name: 'Ada' });
    await expect(service.getProfile()).resolves.toMatchObject({ name: 'Ada' });
    expect(repo.findOne).toHaveBeenCalledWith({ where: {}, order: { createdAt: 'ASC' } });
  });

  it('404s when no profile exists yet', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.getProfile()).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates the existing profile in place', async () => {
    const existing = { id: 'p1', name: 'Ada', headline: 'Engineer' };
    repo.findOne.mockResolvedValue(existing);
    await expect(service.updateProfile({ headline: 'Lead' })).resolves.toMatchObject({ id: 'p1', name: 'Ada', headline: 'Lead' });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('creates the profile on first save when a name is given', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.updateProfile({ name: 'Ada' })).resolves.toMatchObject({ name: 'Ada' });
    expect(repo.create).toHaveBeenCalledOnce();
  });

  it('refuses to create a profile without a name', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.updateProfile({ name: '   ' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.updateProfile({ headline: 'Lead' })).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
