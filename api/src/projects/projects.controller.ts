import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { ReorderProjectsDto } from './dto/reorder-projects.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './project.entity';
import { ProjectsService } from './projects.service';

export const UPLOAD_DIR = './uploads';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(): Promise<Project[]> {
    return this.projectsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Project> {
    return this.projectsService.findOne(id);
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
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          mkdirSync(UPLOAD_DIR, { recursive: true });
          callback(null, UPLOAD_DIR);
        },
        filename: (_req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        if (!/\/(jpg|jpeg|png|webp|gif)$/.test(file.mimetype)) {
          return callback(new BadRequestException('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const baseUrl = process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`;
    return { imageUrl: `${baseUrl}/uploads/${file.filename}` };
  }
}
