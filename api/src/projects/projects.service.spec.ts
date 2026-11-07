import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  const repo = { find: vi.fn(async (): Promise<any[]> => []), findOne: vi.fn(), query: vi.fn() };
  let service: ProjectsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProjectsService(repo as any);
  });

  it('lists only published projects by default', async () => {
    await service.findAll();
    expect(repo.find).toHaveBeenCalledWith(expect.objectContaining({ where: { published: true } }));
  });

  it('includes drafts and view counts for Admin', async () => {
    repo.find.mockResolvedValueOnce([{ id: 'p1', views: 7, published: false }]);
    await expect(service.findAllForAdmin()).resolves.toEqual([{ id: 'p1', views: 7, published: false }]);
    expect(repo.find).toHaveBeenCalledWith(expect.not.objectContaining({ where: expect.anything() }));
  });

  it('hides view counts from the public list and detail', async () => {
    repo.find.mockResolvedValueOnce([{ id: 'p1', title: 'A', views: 7 }]);
    await expect(service.findAll()).resolves.toEqual([{ id: 'p1', title: 'A' }]);
    repo.findOne.mockResolvedValueOnce({ id: 'p1', title: 'A', views: 7 });
    await expect(service.findOne('p1')).resolves.toEqual({ id: 'p1', title: 'A' });
  });

  it('only counts views of published projects', async () => {
    await service.recordView('p1');
    expect(repo.query).toHaveBeenCalledWith(expect.stringContaining('AND published'), ['p1']);
  });

  it('404s on a draft looked up by id', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('draft-id')).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'draft-id', published: true } });
  });
});
