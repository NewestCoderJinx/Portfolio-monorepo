import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post as HttpPost, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './post.entity';
import { PostsService, type PostSummary } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findPublished(): Promise<PostSummary[]> {
    return this.postsService.findPublished();
  }

  /** Every post, drafts included. Declared before :slug so "manage" isn't read as a slug. */
  @UseGuards(JwtAuthGuard)
  @Get('manage')
  findAllForAdmin(): Promise<Post[]> {
    return this.postsService.findAllForAdmin();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string): Promise<Post> {
    return this.postsService.findPublishedBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost()
  create(@Body() dto: CreatePostDto): Promise<Post> {
    return this.postsService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePostDto): Promise<Post> {
    return this.postsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.postsService.remove(id);
  }
}
