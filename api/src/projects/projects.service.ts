import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  /** Published projects only, unless `includeDrafts` (for Admin). */
  findAll(includeDrafts = false): Promise<Project[]> {
    return this.projectRepository.find({
      where: includeDrafts ? {} : { published: true },
      order: { featured: 'DESC', sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  /** A published project; drafts 404 so their ids can't be probed. */
  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { id, published: true } });
    if (!project) {
      throw new NotFoundException(`Project #${id} not found`);
    }
    return project;
  }

  async create(dto: CreateProjectDto): Promise<Project> {
    // New projects go to the top of the manual order.
    const lowest = (await this.projectRepository.minimum('sortOrder')) ?? 0;
    const project = this.projectRepository.create({ ...dto, sortOrder: lowest - 1 });
    return this.projectRepository.save(project);
  }

  /** Persists a new manual order: each id gets its position in the list. */
  async reorder(ids: string[]): Promise<Project[]> {
    await this.projectRepository.manager.transaction(async (manager) => {
      for (const [index, id] of ids.entries()) {
        await manager.update(Project, { id }, { sortOrder: index });
      }
    });
    return this.findAll(true);
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.projectRepository.preload({ id, ...dto });
    if (!project) {
      throw new NotFoundException(`Project #${id} not found`);
    }
    return this.projectRepository.save(project);
  }

  async remove(id: string): Promise<void> {
    const result = await this.projectRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Project #${id} not found`);
    }
  }
}