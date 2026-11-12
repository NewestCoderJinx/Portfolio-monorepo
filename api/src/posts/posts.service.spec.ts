import { ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PostsService } from './posts.service';
import { slugify } from './slug';

describe('slugify', () => {
  it('lowercases, strips accents and joins words with hyphens', () => {
    expect(slugify('  Hello, Wörld! Café & NestJS  ')).toBe('hello-world-cafe-nestjs');
  });

  it('falls back to "post" when nothing usable is left', () => {
    expect(slugify('!!! ')).toBe('post');
  });

  it('caps the length without a trailing hyphen', () => {
    const slug = slugify('word '.repeat(40));
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith('-')).toBe(false);
  });
});

describe('PostsService', () => {
  const repo = {
    find: vi.fn(),
    findOne: vi.fn(),
    exists: vi.fn(),
    create: vi.fn((p) => ({ ...p })),
    save: vi.fn(async (p) => ({ id: 'p1', ...p })),
    delete: vi.fn(),
  };
  let service: PostsService;

  beforeEach(() => {
    vi.clearAllMocks();
    repo.exists.mockResolvedValue(false);
    service = new PostsService(repo as any);
  });

  it('creates a draft with a slug from the title and no publish date', async () => {
    const post = await service.create({ title: ' My First Post ' });
    expect(post).toMatchObject({ title: 'My First Post', slug: 'my-first-post', published: false });
    expect(post.publishedAt).toBeUndefined();
  });

  it('stamps publishedAt when created as published', async () => {
    const post = await service.create({ title: 'Live', published: true });
    expect(post.publishedAt).toBeInstanceOf(Date);
  });

  it('numbers a generated slug that is already taken', async () => {
    repo.exists.mockResolvedValueOnce(true).mockResolvedValueOnce(true).mockResolvedValue(false);
    await expect(service.create({ title: 'Hello' })).resolves.toMatchObject({ slug: 'hello-3' });
  });

  it('rejects a chosen slug that another post uses', async () => {
    repo.exists.mockResolvedValue(true);
    await expect(service.create({ title: 'Hello', slug: 'taken' })).rejects.toBeInstanceOf(ConflictException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('tidies tags, excerpt and cover image', async () => {
    const post = await service.create({ title: 'T', tags: [' ts ', '', 'ts', 'nest'], excerpt: '  ', coverImageUrl: '' });
    expect(post).toMatchObject({ tags: ['ts', 'nest'], excerpt: null, coverImageUrl: null });
  });

  it('keeps the slug when only the title changes', async () => {
    repo.findOne.mockResolvedValue({ id: 'p1', title: 'Old', slug: 'old', published: false, publishedAt: null });
    await expect(service.update('p1', { title: 'New' })).resolves.toMatchObject({ title: 'New', slug: 'old' });
  });

  it('stamps publishedAt the first time a draft is published and keeps it after', async () => {
    const first = new Date('2026-01-01');
    repo.findOne.mockResolvedValue({ id: 'p1', slug: 's', published: false, publishedAt: null });
    expect((await service.update('p1', { published: true })).publishedAt).toBeInstanceOf(Date);

    repo.findOne.mockResolvedValue({ id: 'p1', slug: 's', published: false, publishedAt: first });
    expect((await service.update('p1', { published: true })).publishedAt).toBe(first);
  });

  it('checks a changed slug against other posts only', async () => {
    repo.findOne.mockResolvedValue({ id: 'p1', slug: 'old', published: false, publishedAt: null });
    repo.exists.mockResolvedValue(true);
    await expect(service.update('p1', { slug: 'new' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('only serves published posts to the public, without bodies in the list', async () => {
    repo.find.mockResolvedValue([{ id: 'p1', slug: 's', body: '# hi', published: true }]);
    const list = await service.findPublished();
    expect(repo.find).toHaveBeenCalledWith(expect.objectContaining({ where: { published: true } }));
    expect(list[0]).not.toHaveProperty('body');

    repo.findOne.mockResolvedValue(null);
    await expect(service.findPublishedBySlug('draft')).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { slug: 'draft', published: true } });
  });

  it('404s when updating or deleting a missing post', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.update('nope', { title: 'x' })).rejects.toBeInstanceOf(NotFoundException);
    repo.delete.mockResolvedValue({ affected: 0 });
    await expect(service.remove('nope')).rejects.toBeInstanceOf(NotFoundException);
  });
});
