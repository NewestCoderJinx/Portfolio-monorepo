import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { Testimonial } from './testimonial.entity';

@Injectable()
export class TestimonialsService {
  constructor(
    @InjectRepository(Testimonial)
    private readonly testimonialRepository: Repository<Testimonial>,
  ) {}

  /** Newest first; published only unless `includeHidden` (for Admin). */
  findAll(includeHidden = false): Promise<Testimonial[]> {
    return this.testimonialRepository.find({
      where: includeHidden ? {} : { published: true },
      order: { createdAt: 'DESC' },
    });
  }

  create(dto: CreateTestimonialDto): Promise<Testimonial> {
    return this.testimonialRepository.save(this.testimonialRepository.create(trimmed(dto)));
  }

  async update(id: string, dto: UpdateTestimonialDto): Promise<Testimonial> {
    const testimonial = await this.testimonialRepository.preload({ id, ...trimmed(dto) });
    if (!testimonial) {
      throw new NotFoundException(`Testimonial #${id} not found`);
    }
    return this.testimonialRepository.save(testimonial);
  }

  async remove(id: string): Promise<void> {
    const result = await this.testimonialRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Testimonial #${id} not found`);
    }
  }
}

/** Trims text fields; blank optional ones become null so they are cleared. */
function trimmed<T extends UpdateTestimonialDto>(dto: T): Partial<Testimonial> {
  const out: Partial<Testimonial> = { ...dto } as Partial<Testimonial>;
  if (dto.name !== undefined) out.name = dto.name.trim();
  if (dto.quote !== undefined) out.quote = dto.quote.trim();
  for (const key of ['role', 'company', 'avatarUrl', 'linkUrl'] as const) {
    if (dto[key] !== undefined) out[key] = dto[key]?.trim() || null;
  }
  return out;
}
