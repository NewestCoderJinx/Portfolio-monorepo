import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './message.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  /** Saves a contact form message. Honeypot hits are dropped silently so bots see a normal success. */
  async receive(dto: CreateMessageDto): Promise<void> {
    if (dto.website?.trim()) return;
    await this.messageRepository.save(
      this.messageRepository.create({ name: dto.name.trim(), email: dto.email.trim(), body: dto.body.trim() }),
    );
  }

  findAll(): Promise<Message[]> {
    return this.messageRepository.find({ order: { createdAt: 'DESC' } });
  }

  async setRead(id: string, read: boolean): Promise<Message> {
    const message = await this.messageRepository.findOne({ where: { id } });
    if (!message) {
      throw new NotFoundException(`Message #${id} not found`);
    }
    message.read = read;
    return this.messageRepository.save(message);
  }

  async remove(id: string): Promise<void> {
    const result = await this.messageRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Message #${id} not found`);
    }
  }
}
