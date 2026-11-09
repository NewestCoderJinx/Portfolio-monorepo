import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request, Response } from 'express';
import { isUUID } from 'class-validator';
import { Repository } from 'typeorm';
import { Profile } from '../profile/entities/profile.entity';
import { Project } from '../projects/project.entity';
import { absoluteUrl, renderSharePage } from './share-page';

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

  @Get('projects/:id')
  async project(@Param('id') id: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const site = siteUrl(req);
    // Drafts and unknown ids just go to the portfolio, so ids can't be probed.
    const project = isUUID(id) ? await this.projects.findOne({ where: { id, published: true } }) : null;
    if (!project) {
      res.redirect(302, `${site}/`);
      return;
    }
    const profile = await this.profiles.findOne({ where: {}, order: { createdAt: 'ASC' } });

    const html = renderSharePage({
      title: profile?.name ? `${project.title} | ${profile.name}` : project.title,
      description: project.description || project.problem || profile?.headline,
      image: absoluteUrl(project.imageUrl, site) ?? absoluteUrl(profile?.avatarUrl, site),
      shareUrl: `${site}/p/${project.id}`,
      targetUrl: `${site}/#project-${project.id}`,
      siteName: profile?.name,
    });
    res.set('Cache-Control', 'public, max-age=300').type('html').send(html);
  }
}
