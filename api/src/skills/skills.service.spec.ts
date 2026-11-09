import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SkillsService } from './skills.service';

describe('SkillsService', () => {
  const qb = { where: vi.fn().mockReturnThis(), getOne: vi.fn() };
  const repo = {
    create: vi.fn((s) => s),
    save: vi.fn(async (s) => ({ id: 's1', ...s })),
    preload: vi.fn(),
    delete: vi.fn(),
    maximum: vi.fn(),
    createQueryBuilder: vi.fn(() => qb),
  };
  let service: SkillsService;

  beforeEach(() => {
    vi.clearAllMocks();
    qb.getOne.mockResolvedValue(null);
    service = new SkillsService(repo as any);
  });

  it('trims text, stores a blank category as null and appends to the end of the order', async () => {
    repo.maximum.mockResolvedValue(4);
    await service.create({ name: ' TypeScript ', category: '  ' });
    expect(repo.save).toHaveBeenCalledWith({ name: 'TypeScript', category: null, sortOrder: 5 });
  });

  it('starts the order at 0 when there are no skills yet', async () => {
    repo.maximum.mockResolvedValue(null);
    await service.create({ name: 'Go' });
    expect(repo.save).toHaveBeenCalledWith({ name: 'Go', sortOrder: 0 });
  });

  it('rejects a name already used by another skill, ignoring case', async () => {
    qb.getOne.mockResolvedValue({ id: 'other', name: 'TypeScript' });
    await expect(service.create({ name: 'typescript' })).rejects.toBeInstanceOf(ConflictException);
    repo.preload.mockResolvedValue({ id: 's1', name: 'typescript' });
    await expect(service.update('s1', { name: 'typescript' })).rejects.toBeInstanceOf(ConflictException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('lets a skill keep its own name when renaming its case', async () => {
    qb.getOne.mockResolvedValue({ id: 's1', name: 'Typescript' });
    repo.preload.mockResolvedValue({ id: 's1', name: 'TypeScript' });
    await service.update('s1', { name: 'TypeScript' });
    expect(repo.save).toHaveBeenCalled();
  });

  it('rejects a blank name', async () => {
    await expect(service.create({ name: '   ' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('404s on unknown ids', async () => {
    repo.preload.mockResolvedValue(undefined);
    await expect(service.update('nope', { category: 'x' })).rejects.toBeInstanceOf(NotFoundException);
    repo.delete.mockResolvedValue({ affected: 0 });
    await expect(service.remove('nope')).rejects.toBeInstanceOf(NotFoundException);
  });
});
