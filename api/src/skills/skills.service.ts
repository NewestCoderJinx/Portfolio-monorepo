import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { Skill } from './skill.entity';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
  ) {}

  findAll(): Promise<Skill[]> {
    return this.skillRepository.find({ order: { sortOrder: 'ASC', createdAt: 'ASC' } });
  }

  async create(dto: CreateSkillDto): Promise<Skill> {
    const data = clean(dto);
    await this.assertNameFree(data.name!);
    // New skills go to the end of the manual order.
    const highest = (await this.skillRepository.maximum('sortOrder')) ?? -1;
    return this.skillRepository.save(this.skillRepository.create({ ...data, sortOrder: highest + 1 }));
  }

  async update(id: string, dto: UpdateSkillDto): Promise<Skill> {
    const data = clean(dto);
    const skill = await this.skillRepository.preload({ id, ...data });
    if (!skill) {
      throw new NotFoundException(`Skill #${id} not found`);
    }
    if (data.name !== undefined) await this.assertNameFree(skill.name, id);
    return this.skillRepository.save(skill);
  }

  /** Persists a new manual order: each id gets its position in the list. */
  async reorder(ids: string[]): Promise<Skill[]> {
    await this.skillRepository.manager.transaction(async (manager) => {
      for (const [index, id] of ids.entries()) {
        await manager.update(Skill, { id }, { sortOrder: index });
      }
    });
    return this.findAll();
  }

  async remove(id: string): Promise<void> {
    const result = await this.skillRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Skill #${id} not found`);
    }
  }

  private async assertNameFree(name: string, exceptId?: string) {
    const existing = await this.skillRepository
      .createQueryBuilder('s')
      .where('LOWER(s.name) = LOWER(:name)', { name })
      .getOne();
    if (existing && existing.id !== exceptId) {
      throw new ConflictException(`"${existing.name}" is already in your skills`);
    }
  }
}

/** Trims text; a blank category becomes null so the skill falls under "Other". */
function clean(dto: UpdateSkillDto): Partial<Skill> {
  const out = { ...dto } as Partial<Skill>;
  if (dto.name !== undefined) {
    out.name = dto.name.trim();
    if (!out.name) throw new BadRequestException('name must not be blank');
  }
  if (dto.category !== undefined) out.category = dto.category?.trim() || null;
  return out;
}
