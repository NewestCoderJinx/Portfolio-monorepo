import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { Experience } from './experience.entity';

@Injectable()
export class ExperienceService {
  constructor(
    @InjectRepository(Experience)
    private readonly experienceRepository: Repository<Experience>,
  ) {}

  /** Current roles first, then most recent start date first. */
  findAll(): Promise<Experience[]> {
    return this.experienceRepository
      .createQueryBuilder('e')
      .orderBy('e.endDate', 'DESC', 'NULLS FIRST')
      .addOrderBy('e.startDate', 'DESC')
      .getMany();
  }

  async create(dto: CreateExperienceDto): Promise<Experience> {
    assertDateRange(dto.startDate, dto.endDate);
    return this.experienceRepository.save(this.experienceRepository.create(dto as Partial<Experience>));
  }

  async update(id: string, dto: UpdateExperienceDto): Promise<Experience> {
    const experience = await this.experienceRepository.preload({ id, ...(dto as Partial<Experience>) });
    if (!experience) {
      throw new NotFoundException(`Experience #${id} not found`);
    }
    assertDateRange(experience.startDate, experience.endDate);
    return this.experienceRepository.save(experience);
  }

  async remove(id: string): Promise<void> {
    const result = await this.experienceRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Experience #${id} not found`);
    }
  }
}

function assertDateRange(start: string, end?: string | null) {
  if (end && end < start) {
    throw new BadRequestException('endDate must not be before startDate');
  }
}
