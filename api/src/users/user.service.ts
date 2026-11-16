import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email: email.toLowerCase() } });
  }

  findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async setPassword(id: string, passwordHash: string, changedAt: Date): Promise<void> {
    await this.userRepository.update({ id }, { passwordHash, passwordChangedAt: changedAt });
  }

  async update(id: string, changes: Partial<Pick<User, 'totpSecret' | 'totpEnabledAt' | 'totpLastUsedStep' | 'totpRecoveryCodes'>>): Promise<void> {
    await this.userRepository.update({ id }, changes);
  }

  count(): Promise<number> {
    return this.userRepository.count();
  }

  create(email: string, passwordHash: string): Promise<User> {
    const user = this.userRepository.create({ email: email.toLowerCase(), passwordHash });
    return this.userRepository.save(user);
  }
}
