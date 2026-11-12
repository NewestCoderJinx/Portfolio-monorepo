import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request, Response } from 'express';
import { isUUID } from 'class-validator';
import { Repository } from 'typeorm';
import { Post } from '../posts/post.entity';
import { Profile } from '../profile/entities/profile.entity';
import { RateLimiter } from '../common/rate-limiter';
import { Project } from '../projects/project.entity';
import { VIEW_WINDOW_MS } from '../projects/projects.controller';
import { ProjectsService } from '../projects/projects.service';
import { isBot } from './bots';
import { renderPreviewPng } from './preview-image';
import { absoluteUrl, markdownToText, renderSharePage } from './share-page';

/** Rendered previews, keyed by project and the last edits that affect them. */
const IMAGE_CACHE_LIMIT = 50;

/**
 * The portfolio's public address, for links in share pages. SITE_URL wins; otherwise it's taken from
 * the request, which works when nginx forwards /p/ on the same host.
 */
export function siteUrl(req: Request): string {
  const configured = process.env.SITE_URL?.trim().replace(/\/+$/, '');
  if (configured) return configured;
  const proto = req.get('x-forwarded-proto')?.split(',')[0].trim() || req.protocol;
  const host = req.get('x-forwarded-host')?.split(',')[0].trim() || req.get('host');
  return `${proto}://${host}`;
}

/** Link-preview pages for sharing a single case study. */
@Controller('share')
export class ShareController {
  constructor(
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    @InjectRepository(Profile) private readonly profiles: Repository<Profile>,
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    private readonly projectsService: ProjectsService,
  ) {}

  /** Like case-study views: one click per visitor per project per window. */
  private readonly clickLimiter = new RateLimiter(1, VIEW_WINDOW_MS);

  private readonly imageCache = new Map<string, Buffer>();

  private findPublished(id: string): Promise<Project | null> {
    return isUUID(id) ? this.projects.findOne({ where: { id, published: true } }) : Promise.resolve(null);
  }

  private findPublishedPost(slug: string): Promise<Post | null> {
    return this.posts.findOne({ where: { slug, published: true } });
  }

  private findProfile(): Promise<Profile | null> {
    return this.profiles.findOne({ where: {}, order: { createdAt: 'ASC' } });
  }

  @Get('projects/:id')
  async project(@Param('id') id: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const site = siteUrl(req);
    // Drafts and unknown ids just go to the portfolio, so ids can't be probed.
    const project = await this.findPublished(id);
    if (!project) {
      res.redirect(302, `${site}/`);
      return;
    }
    if (!isBot(req.get('user-agent')) && this.clickLimiter.tryHit(`${req.ip ?? 'unknown'}:${project.id}`)) {
      await this.projectsService.recordShareClick(project.id);
    }
    const profile = await this.findProfile();
    // Without a cover, use the generated card; the version makes crawlers refetch it after edits.
    const generated = `${site}/p/${project.id}/image.png?v=${imageVersion(project, profile)}`;

    const html = renderSharePage({
      title: profile?.name ? `${project.title} | ${profile.name}` : project.title,
      description: project.description || project.problem || profile?.headline,
      image: absoluteUrl(project.imageUrl, site) ?? generated,
      shareUrl: `${site}/p/${project.id}`,
      targetUrl: `${site}/#project-${project.id}`,
      siteName: profile?.name,
    });
    res.set('Cache-Control', 'public, max-age=300').type('html').send(html);
  }

  /** A generated 1200×630 preview card for the project, used when it has no cover image. */
  @Get('projects/:id/image.png')
  async projectImage(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const project = await this.findPublished(id);
    if (!project) {
      res.status(404).end();
      return;
    }
    const profile = await this.findProfile();
    this.sendCard(res, `${project.id}:${imageVersion(project, profile)}`, () =>
      renderPreviewPng({
        title: project.title,
        description: project.description || project.problem,
        tags: project.tags,
        name: profile?.name,
        headline: profile?.headline,
      }),
    );
  }

  /**
   * Preview tags for /blog/<slug>. nginx sends only link-preview crawlers here (people and search
   * engines get the app), so the page sits at the post's real address and doesn't redirect.
   */
  @Get('posts/:slug')
  async post(@Param('slug') slug: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const site = siteUrl(req);
    const post = await this.findPublishedPost(slug);
    if (!post) {
      res.redirect(302, `${site}/blog`);
      return;
    }
    const profile = await this.findProfile();
    const url = `${site}/blog/${post.slug}`;
    const generated = `${site}/api/share/posts/${post.slug}/image.png?v=${imageVersion(post, profile)}`;

    const html = renderSharePage({
      title: profile?.name ? `${post.title} | ${profile.name}` : post.title,
      description: post.excerpt || markdownToText(post.body) || profile?.headline,
      image: absoluteUrl(post.coverImageUrl, site) ?? generated,
      shareUrl: url,
      targetUrl: url,
      siteName: profile?.name,
      publishedTime: post.publishedAt?.toISOString(),
      forward: false,
    });
    res.set('Cache-Control', 'public, max-age=300').type('html').send(html);
  }

  /** A generated 1200×630 preview card for a post without a cover image. */
  @Get('posts/:slug/image.png')
  async postImage(@Param('slug') slug: string, @Res() res: Response): Promise<void> {
    const post = await this.findPublishedPost(slug);
    if (!post) {
      res.status(404).end();
      return;
    }
    const profile = await this.findProfile();
    this.sendCard(res, `post:${post.id}:${imageVersion(post, profile)}`, () =>
      renderPreviewPng({
        kicker: 'Blog post',
        title: post.title,
        description: post.excerpt || markdownToText(post.body),
        tags: post.tags,
        name: profile?.name,
        headline: profile?.headline,
      }),
    );
  }

  /** Serves a preview card from the cache, rendering it on a miss. */
  private sendCard(res: Response, key: string, render: () => Buffer): void {
    let png = this.imageCache.get(key);
    if (!png) {
      png = render();
      if (this.imageCache.size >= IMAGE_CACHE_LIMIT) this.imageCache.delete(this.imageCache.keys().next().value!);
      this.imageCache.set(key, png);
    }
    res.set('Cache-Control', 'public, max-age=86400').type('png').send(png);
  }
}

/** Changes whenever the item or profile is edited, so caches keyed on it never go stale. */
export function imageVersion(item: Pick<Project | Post, 'updatedAt'>, profile: Pick<Profile, 'updatedAt'> | null): string {
  return Math.max(item.updatedAt.getTime(), profile?.updatedAt?.getTime() ?? 0).toString(36);
}
