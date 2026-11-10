import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request, Response } from 'express';
import { isUUID } from 'class-validator';
import { Repository } from 'typeorm';
import { Profile } from '../profile/entities/profile.entity';
import { Project } from '../projects/project.entity';
import { renderPreviewPng } from './preview-image';
import { absoluteUrl, renderSharePage } from './share-page';

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
  ) {}

  private readonly imageCache = new Map<string, Buffer>();

  private findPublished(id: string): Promise<Project | null> {
    return isUUID(id) ? this.projects.findOne({ where: { id, published: true } }) : Promise.resolve(null);
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
    const key = `${project.id}:${imageVersion(project, profile)}`;
    let png = this.imageCache.get(key);
    if (!png) {
      png = renderPreviewPng({
        title: project.title,
        description: project.description || project.problem,
        tags: project.tags,
        name: profile?.name,
        headline: profile?.headline,
      });
      if (this.imageCache.size >= IMAGE_CACHE_LIMIT) this.imageCache.delete(this.imageCache.keys().next().value!);
      this.imageCache.set(key, png);
    }
    res.set('Cache-Control', 'public, max-age=86400').type('png').send(png);
  }
}

/** Changes whenever the project or profile is edited, so caches keyed on it never go stale. */
export function imageVersion(project: Pick<Project, 'updatedAt'>, profile: Pick<Profile, 'updatedAt'> | null): string {
  return Math.max(project.updatedAt.getTime(), profile?.updatedAt?.getTime() ?? 0).toString(36);
}
