import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { optimizeUploadedImage } from '../common/images';
import { RateLimiter } from '../common/rate-limiter';
import { uploadedFileUrl, uploadOptions } from '../common/uploads';
import { CreateProjectDto } from './dto/create-project.dto';
import { ReorderProjectsDto } from './dto/reorder-projects.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './project.entity';
import { ProjectStatsService, type ProjectStats } from './project-stats.service';
import { ProjectsService, type PublicProject } from './projects.service';

/** A visitor re-opening the same case study within this window isn't counted again. */
export const VIEW_WINDOW_MS = 30 * 60 * 1000;

@Controller('projects')
export class ProjectsController {
  private readonly viewLimiter = new RateLimiter(1, VIEW_WINDOW_MS);

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly statsService: ProjectStatsService,
  ) {}

  @Get()
  findAll(): Promise<PublicProject[]> {
    return this.projectsService.findAll();
  }

  /** Every project, drafts included. Declared before :id so "manage" isn't parsed as an id. */
  @UseGuards(JwtAuthGuard)
  @Get('manage')
  findAllForAdmin(): Promise<Project[]> {
    return this.projectsService.findAllForAdmin();
  }

  /** Daily views and share visits for the last `days` days (7–365, default 30). Declared before :id. */
  @UseGuards(JwtAuthGuard)
  @Get('stats')
  stats(@Query('days') days?: string): Promise<ProjectStats> {
    return this.statsService.forLastDays(parseInt(days ?? '30', 10));
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PublicProject> {
    return this.projectsService.findOne(id);
  }

  /** Public: the page calls this when a visitor opens a case study. Each visitor counts once per project per window. */
  @Post(':id/view')
  @HttpCode(204)
  async recordView(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request): Promise<void> {
    if (this.viewLimiter.tryHit(`${req.ip ?? 'unknown'}:${id}`)) {
      await this.projectsService.recordView(id);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateProjectDto): Promise<Project> {
    return this.projectsService.create(dto);
  }

  // Must be declared before PATCH :id so "reorder" isn't treated as an id.
  @UseGuards(JwtAuthGuard)
  @Patch('reorder')
  reorder(@Body() dto: ReorderProjectsDto): Promise<Project[]> {
    return this.projectsService.reorder(dto.ids);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<Project> {
    return this.projectsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.projectsService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor(
      'file',
      uploadOptions({ maxBytes: 5 * 1024 * 1024, mimeTypes: /\/(jpg|jpeg|png|webp|gif)$/, error: 'Only image files are allowed!' }),
    ),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    // Resized and re-encoded as WebP; the URL points at the optimised file.
    return { imageUrl: uploadedFileUrl(req, file && (await optimizeUploadedImage(file))) };
  }
}
