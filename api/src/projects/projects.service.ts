import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

export type PublicProject = Omit<Project, 'views' | 'shareClicks'>;

const ORDER = { featured: 'DESC', sortOrder: 'ASC', createdAt: 'DESC' } as const;

function toPublic({ views: _views, shareClicks: _shareClicks, ...project }: Project): PublicProject {
  return project;
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  /** Every project with its view count, drafts included (for Admin). */
  findAllForAdmin(): Promise<Project[]> {
    return this.projectRepository.find({ order: ORDER });
  }

  /** Published projects for the public page, without Admin-only stats. */
  async findAll(): Promise<PublicProject[]> {
    return (await this.projectRepository.find({ where: { published: true }, order: ORDER })).map(toPublic);
  }

  /** A published project; drafts 404 so their ids can't be probed. */
  async findOne(id: string): Promise<PublicProject> {
    const project = await this.projectRepository.findOne({ where: { id, published: true } });
    if (!project) {
      throw new NotFoundException(`Project #${id} not found`);
    }
    return toPublic(project);
  }

  /** Counts one case-study view of a published project. Raw SQL so updatedAt still means "last edited". */
  async recordView(id: string): Promise<void> {
    await this.projectRepository.query('UPDATE projects SET views = views + 1 WHERE id = $1 AND published', [id]);
  }

  /** Counts one visit through a share link. Raw SQL so updatedAt (and the preview image version) don't change. */
  async recordShareClick(id: string): Promise<void> {
    await this.projectRepository.query('UPDATE projects SET "shareClicks" = "shareClicks" + 1 WHERE id = $1 AND published', [id]);
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
    return this.findAllForAdmin();
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