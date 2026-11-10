import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RateLimiter } from '../../common/rate-limiter';
import { CreateTestimonialRequestDto, SubmitTestimonialDto } from './dto';
import { TestimonialRequest } from './testimonial-request.entity';
import { TestimonialRequestsService, type RequestInvite } from './testimonial-requests.service';

@Controller('testimonial-requests')
export class TestimonialRequestsController {
  /** Slows token guessing and form spam: lookups and submissions per IP per hour. */
  private readonly lookupLimiter = new RateLimiter(30, 60 * 60 * 1000);
  private readonly submitLimiter = new RateLimiter(5, 60 * 60 * 1000);

  constructor(private readonly service: TestimonialRequestsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(): Promise<TestimonialRequest[]> {
    return this.service.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateTestimonialRequestDto): Promise<TestimonialRequest> {
    return this.service.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(204)
  revoke(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.revoke(id);
  }

  /** Public: the form loads this to greet the person. */
  @Get(':token')
  invite(@Param('token') token: string, @Req() req: Request): Promise<RequestInvite> {
    this.limit(this.lookupLimiter, req);
    return this.service.invite(token);
  }

  /** Public: the form posts here. */
  @Post(':token')
  @HttpCode(202)
  async submit(@Param('token') token: string, @Body() dto: SubmitTestimonialDto, @Req() req: Request): Promise<{ ok: true }> {
    this.limit(this.submitLimiter, req);
    await this.service.submit(token, dto);
    return { ok: true };
  }

  private limit(limiter: RateLimiter, req: Request) {
    if (!limiter.tryHit(req.ip ?? 'unknown')) {
      throw new HttpException('Too many attempts. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }
}
