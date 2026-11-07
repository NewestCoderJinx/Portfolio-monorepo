import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectsService } from './projects.service';

describe('ProjectsService drafts', () => {
  const repo = { find: vi.fn(async () => []), findOne: vi.fn() };
  let service: ProjectsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProjectsService(repo as any);
  });

  it('lists only published projects by default', async () => {
    await service.findAll();
    expect(repo.find).toHaveBeenCalledWith(expect.objectContaining({ where: { published: true } }));
  });

  it('includes drafts for Admin', async () => {
    await service.findAll(true);
    expect(repo.find).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });

  it('404s on a draft looked up by id', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('draft-id')).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'draft-id', published: true } });
  });
});
