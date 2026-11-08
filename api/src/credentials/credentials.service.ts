import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Credential } from './credential.entity';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { UpdateCredentialDto } from './dto/update-credential.dto';

@Injectable()
export class CredentialsService {
  constructor(
    @InjectRepository(Credential)
    private readonly credentialRepository: Repository<Credential>,
  ) {}

  /** In-progress first, then most recent first. */
  findAll(): Promise<Credential[]> {
    return this.credentialRepository
      .createQueryBuilder('c')
      .orderBy('c.endDate', 'DESC', 'NULLS FIRST')
      .addOrderBy('c.startDate', 'DESC', 'NULLS LAST')
      .addOrderBy('c.createdAt', 'DESC')
      .getMany();
  }

  async create(dto: CreateCredentialDto): Promise<Credential> {
    const data = clean(dto);
    assertDateRange(data.startDate, data.endDate);
    return this.credentialRepository.save(this.credentialRepository.create(data));
  }

  async update(id: string, dto: UpdateCredentialDto): Promise<Credential> {
    const credential = await this.credentialRepository.preload({ id, ...clean(dto) });
    if (!credential) {
      throw new NotFoundException(`Credential #${id} not found`);
    }
    assertDateRange(credential.startDate, credential.endDate);
    return this.credentialRepository.save(credential);
  }

  async remove(id: string): Promise<void> {
    const result = await this.credentialRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Credential #${id} not found`);
    }
  }
}

/** Trims text; blank optional text becomes null so it is cleared. */
function clean(dto: UpdateCredentialDto): Partial<Credential> {
  const out = { ...dto } as Partial<Credential>;
  if (dto.title !== undefined) out.title = dto.title.trim();
  if (dto.institution !== undefined) out.institution = dto.institution.trim();
  if (dto.description !== undefined) out.description = dto.description?.trim() || null;
  if (dto.credentialUrl !== undefined) out.credentialUrl = dto.credentialUrl?.trim() || null;
  return out;
}

function assertDateRange(start?: string | null, end?: string | null) {
  if (start && end && end < start) {
    throw new BadRequestException('endDate must not be before startDate');
  }
}
