import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Profile } from '../profile/entities/profile.entity';
import { TestimonialRequest } from './requests/testimonial-request.entity';
import { TestimonialRequestsController } from './requests/testimonial-requests.controller';
import { TestimonialRequestsService } from './requests/testimonial-requests.service';
import { Testimonial } from './testimonial.entity';
import { TestimonialsController } from './testimonials.controller';
import { TestimonialsService } from './testimonials.service';

@Module({
  imports: [TypeOrmModule.forFeature([Testimonial, TestimonialRequest, Profile]), AuthModule],
  controllers: [TestimonialsController, TestimonialRequestsController],
  providers: [TestimonialsService, TestimonialRequestsService],
})
export class TestimonialsModule {}
