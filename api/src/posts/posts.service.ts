import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreatePostDto, SLUG_MAX } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './post.entity';
import { slugify } from './slug';

/** What the public post list returns: everything but the body. */
export type PostSummary = Omit<Post, 'body'>;

function clean(dto: UpdatePostDto): UpdatePostDto {
  const out = { ...dto };
  if (out.title !== undefined) out.title = out.title.trim();
  if (out.excerpt !== undefined) out.excerpt = out.excerpt?.trim() || null;
  if (out.coverImageUrl !== undefined) out.coverImageUrl = out.coverImageUrl?.trim() || null;
  if (out.tags !== undefined) {
    const tags = (out.tags ?? []).map((t) => t.trim()).filter(Boolean);
    out.tags = tags.length ? [...new Set(tags)] : null;
  }
  return out;
}

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  /** Every post, drafts included, newest first (for Admin). */
  findAllForAdmin(): Promise<Post[]> {
    return this.postRepository.find({ order: { createdAt: 'DESC' } });
  }

  /** Published posts, newest first, without their bodies. */
  async findPublished(): Promise<PostSummary[]> {
    const posts = await this.postRepository.find({ where: { published: true }, order: { publishedAt: 'DESC' } });
    return posts.map(({ body: _body, ...summary }) => summary);
  }

  /** A published post by slug; drafts 404 like missing posts. */
  async findPublishedBySlug(slug: string): Promise<Post> {
    const post = await this.postRepository.findOne({ where: { slug, published: true } });
    if (!post) {
      throw new NotFoundException(`Post "${slug}" not found`);
    }
    return post;
  }

  async create(dto: CreatePostDto): Promise<Post> {
    const data = clean(dto) as CreatePostDto;
    const slug = dto.slug ? await this.claimSlug(dto.slug) : await this.freeSlug(slugify(data.title));
    const post = this.postRepository.create({ ...data, slug, published: !!data.published });
    if (post.published) post.publishedAt = new Date();
    return this.postRepository.save(post);
  }

  async update(id: string, dto: UpdatePostDto): Promise<Post> {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException(`Post #${id} not found`);
    }
    const data = clean(dto);
    if (data.slug !== undefined && data.slug !== post.slug) {
      data.slug = await this.claimSlug(data.slug, id);
    }
    Object.assign(post, data);
    if (post.published && !post.publishedAt) post.publishedAt = new Date();
    return this.postRepository.save(post);
  }

  async remove(id: string): Promise<void> {
    const result = await this.postRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Post #${id} not found`);
    }
  }

  /** A slug the author picked: must not belong to another post. */
  private async claimSlug(slug: string, ownId?: string): Promise<string> {
    const taken = await this.postRepository.exists({ where: { slug, ...(ownId ? { id: Not(ownId) } : {}) } });
    if (taken) {
      throw new ConflictException(`Another post already uses the link "${slug}"`);
    }
    return slug;
  }

  /** A generated slug: adds -2, -3, ... until it's free. */
  private async freeSlug(base: string): Promise<string> {
    for (let n = 1; ; n++) {
      const suffix = n === 1 ? '' : `-${n}`;
      const candidate = base.slice(0, SLUG_MAX - suffix.length).replace(/-+$/, '') + suffix;
      if (!(await this.postRepository.exists({ where: { slug: candidate } }))) {
        return candidate;
      }
    }
  }
}
