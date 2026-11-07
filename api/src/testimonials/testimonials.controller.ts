import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { Testimonial } from './testimonial.entity';
import { TestimonialsService } from './testimonials.service';

@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Get()
  findAll(): Promise<Testimonial[]> {
    return this.testimonialsService.findAll();
  }

  /** Every testimonial, hidden ones included. */
  @UseGuards(JwtAuthGuard)
  @Get('manage')
  findAllForAdmin(): Promise<Testimonial[]> {
    return this.testimonialsService.findAll(true);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateTestimonialDto): Promise<Testimonial> {
    return this.testimonialsService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTestimonialDto): Promise<Testimonial> {
    return this.testimonialsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.testimonialsService.remove(id);
  }
}
