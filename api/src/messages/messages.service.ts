import { BadRequestException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { Profile } from '../profile/entities/profile.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Message } from './message.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private readonly mail: MailService,
  ) {}

  private readonly logger = new Logger(MessagesService.name);

  /** Saves a contact form message. Honeypot hits are dropped silently so bots see a normal success. */
  async receive(dto: CreateMessageDto): Promise<void> {
    if (dto.website?.trim()) return;
    const message = await this.messageRepository.save(
      this.messageRepository.create({ name: dto.name.trim(), email: dto.email.trim(), body: dto.body.trim() }),
    );
    // Not awaited: the visitor shouldn't wait on (or see errors from) the mail server.
    void this.notify(message);
  }

  /**
   * Emails the owner about a new message, with Reply-To set to the visitor. Goes to NOTIFY_EMAIL, else
   * the profile email. Never throws: the message is already saved and shows in the Admin inbox anyway.
   */
  /** Where alerts would go right now, for Admin. */
  async alertStatus(): Promise<{ enabled: boolean; recipient: string | null }> {
    if (!this.mail.enabled) return { enabled: false, recipient: null };
    return { enabled: true, recipient: await this.alertRecipient() };
  }

  /** Sends a sample alert so the owner can check their SMTP settings. Unlike notify(), errors are reported. */
  async sendTestAlert(): Promise<{ recipient: string }> {
    if (!this.mail.enabled) throw new BadRequestException('Email alerts are off: set SMTP_HOST and related settings on the API.');
    const recipient = await this.alertRecipient();
    if (!recipient) throw new BadRequestException('No recipient: set NOTIFY_EMAIL on the API or add an email to your profile.');
    try {
      await this.mail.send({
        to: recipient,
        subject: 'Test alert from your portfolio',
        text: 'Email alerts are working. You will get an email like this whenever someone uses your contact form.',
      });
    } catch (err) {
      throw new ServiceUnavailableException(`The mail server refused the test email: ${(err as Error).message}`);
    }
    return { recipient };
  }

  private async alertRecipient(): Promise<string | null> {
    return this.mail.notifyTo ?? (await this.profileRepository.findOne({ where: {}, order: { createdAt: 'ASC' } }))?.email ?? null;
  }

  async notify(message: Pick<Message, 'name' | 'email' | 'body'>): Promise<boolean> {
    if (!this.mail.enabled) return false;
    try {
      const to = await this.alertRecipient();
      if (!to) {
        this.logger.warn('New message not emailed: set NOTIFY_EMAIL or an email on the profile.');
        return false;
      }
      await this.mail.send({ to, replyTo: message.email, ...newMessageEmail(message) });
      return true;
    } catch (err) {
      this.logger.error(`Could not email new message alert: ${(err as Error).message}`);
      return false;
    }
  }

  findAll(): Promise<Message[]> {
    return this.messageRepository.find({ order: { createdAt: 'DESC' } });
  }

  async update(id: string, dto: UpdateMessageDto): Promise<Message> {
    const message = await this.messageRepository.findOne({ where: { id } });
    if (!message) {
      throw new NotFoundException(`Message #${id} not found`);
    }
    if (dto.read !== undefined) message.read = dto.read;
    if (dto.archived !== undefined) message.archived = dto.archived;
    if (dto.replied === false) message.repliedAt = null;
    // Replying implies the message was read.
    if (dto.replied) {
      message.repliedAt ??= new Date();
      message.read = true;
    }
    return this.messageRepository.save(message);
  }

  /** Marks every unread message in the inbox (not the archive) as read; returns how many changed. */
  async markAllRead(): Promise<number> {
    const result = await this.messageRepository.update({ read: false, archived: false }, { read: true });
    return result.affected ?? 0;
  }

  async remove(id: string): Promise<void> {
    const result = await this.messageRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Message #${id} not found`);
    }
  }
}

/** Subject and plain-text body for a new-message alert. */
export function newMessageEmail(m: Pick<Message, 'name' | 'email' | 'body'>, siteUrl = process.env.SITE_URL?.trim().replace(/\/+$/, '')) {
  const name = m.name.replace(/[\r\n]+/g, ' ').trim();
  const inbox = siteUrl ? `\n\nOpen your inbox: ${siteUrl}/admin` : '';
  return {
    subject: `New message from ${name} via your portfolio`,
    text: `${name} <${m.email}> wrote:\n\n${m.body}\n\n---\nReply to this email to answer them directly.${inbox}`,
  };
}
