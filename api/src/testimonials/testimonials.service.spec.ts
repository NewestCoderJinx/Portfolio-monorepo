import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestimonialsService } from './testimonials.service';

describe('TestimonialsService', () => {
  const repo = {
    find: vi.fn(async () => []),
    create: vi.fn((t) => t),
    save: vi.fn(async (t) => ({ id: 't1', ...t })),
    preload: vi.fn(),
    delete: vi.fn(),
  };
  let service: TestimonialsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TestimonialsService(repo as any);
  });

  it('lists only published testimonials publicly, all for Admin', async () => {
    await service.findAll();
    expect(repo.find).toHaveBeenLastCalledWith(expect.objectContaining({ where: { published: true } }));
    await service.findAll(true);
    expect(repo.find).toHaveBeenLastCalledWith(expect.objectContaining({ where: {} }));
  });

  it('trims text and turns blank optional fields into null', async () => {
    await service.create({ name: ' Grace ', quote: ' Great work. ', role: '  ', company: ' Acme ' });
    expect(repo.save).toHaveBeenCalledWith({ name: 'Grace', quote: 'Great work.', role: null, company: 'Acme' });
  });

  it('leaves omitted fields alone on update', async () => {
    repo.preload.mockImplementation(async (t) => t);
    await service.update('t1', { published: false });
    expect(repo.preload).toHaveBeenCalledWith({ id: 't1', published: false });
  });

  it('treats publishing as approval of a link submission', async () => {
    repo.preload.mockImplementation(async (t) => t);
    await service.update('t1', { published: true });
    expect(repo.preload).toHaveBeenCalledWith({ id: 't1', published: true, submitted: false });
  });

  it('404s on unknown ids', async () => {
    repo.preload.mockResolvedValue(undefined);
    await expect(service.update('nope', { name: 'x' })).rejects.toBeInstanceOf(NotFoundException);
    repo.delete.mockResolvedValue({ affected: 0 });
    await expect(service.remove('nope')).rejects.toBeInstanceOf(NotFoundException);
  });
});
