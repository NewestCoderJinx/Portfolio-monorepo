import { GoneException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { MailService } from '../../mail/mail.service';
import { Profile } from '../../profile/entities/profile.entity';
import { Testimonial } from '../testimonial.entity';
import { CreateTestimonialRequestDto, SubmitTestimonialDto } from './dto';
import { TestimonialRequest } from './testimonial-request.entity';

export const REQUEST_LIFETIME_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/** What the public form needs to greet the person; nothing else about the request leaks. */
export interface RequestInvite {
  recipientName: string | null;
  note: string | null;
  ownerName: string | null;
  ownerHeadline: string | null;
}

const blankToNull = (v?: string | null) => v?.trim() || null;

@Injectable()
export class TestimonialRequestsService {
  constructor(
    @InjectRepository(TestimonialRequest) private readonly requests: Repository<TestimonialRequest>,
    @InjectRepository(Profile) private readonly profiles: Repository<Profile>,
    private readonly mail: MailService,
  ) {}

  private readonly logger = new Logger(TestimonialRequestsService.name);

  /** Newest first, for Admin. */
  findAll(): Promise<TestimonialRequest[]> {
    return this.requests.find({ order: { createdAt: 'DESC' } });
  }

  create(dto: CreateTestimonialRequestDto, now = new Date()): Promise<TestimonialRequest> {
    return this.requests.save(
      this.requests.create({
        token: randomBytes(24).toString('base64url'), // 192 bits, 32 URL-safe characters
        recipientName: blankToNull(dto.recipientName),
        note: blankToNull(dto.note),
        expiresAt: new Date(now.getTime() + REQUEST_LIFETIME_DAYS * DAY_MS),
      }),
    );
  }

  async revoke(id: string): Promise<void> {
    const result = await this.requests.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Request #${id} not found`);
  }

  /** The form's greeting. 404 for unknown tokens; 410 once used or expired. */
  async invite(token: string, now = new Date()): Promise<RequestInvite> {
    const request = await this.usable(token, now);
    const owner = await this.profiles.findOne({ where: {}, order: { createdAt: 'ASC' } });
    return {
      recipientName: request.recipientName,
      note: request.note,
      ownerName: owner?.name ?? null,
      ownerHeadline: owner?.headline ?? null,
    };
  }

  /**
   * Saves the testimonial hidden (awaiting approval) and uses up the link. The claim is a conditional
   * update inside the transaction, so two simultaneous submissions can't both succeed.
   * Returns null for honeypot hits, which look like a success to the bot.
   */
  async submit(token: string, dto: SubmitTestimonialDto, now = new Date()): Promise<Testimonial | null> {
    const request = await this.usable(token, now);
    if (dto.website?.trim()) return null;

    const saved = await this.requests.manager.transaction(async (manager) => {
      const claim = await manager.update(
        TestimonialRequest,
        { id: request.id, usedAt: IsNull(), expiresAt: MoreThan(now) },
        { usedAt: now },
      );
      if (!claim.affected) throw new GoneException('This link has already been used.');

      const testimonial = await manager.save(
        manager.create(Testimonial, {
          name: dto.name.trim(),
          role: blankToNull(dto.role),
          company: blankToNull(dto.company),
          quote: dto.quote.trim(),
          linkUrl: blankToNull(dto.linkUrl),
          avatarUrl: null,
          published: false,
          submitted: true,
        }),
      );
      await manager.update(TestimonialRequest, { id: request.id }, { testimonialId: testimonial.id });
      return testimonial;
    });
    // Not awaited: the person shouldn't wait on (or see errors from) the mail server.
    void this.notifyOwner(saved);
    return saved;
  }

  /** Emails the owner that a testimonial awaits approval (NOTIFY_EMAIL, else the profile email). Never throws. */
  async notifyOwner(t: Pick<Testimonial, 'name' | 'role' | 'company' | 'quote'>): Promise<boolean> {
    if (!this.mail.enabled) return false;
    try {
      const to = this.mail.notifyTo ?? (await this.profiles.findOne({ where: {}, order: { createdAt: 'ASC' } }))?.email;
      if (!to) return false;
      const name = t.name.replace(/[\r\n]+/g, ' ').trim();
      const who = [t.role, t.company].filter(Boolean).join(', ');
      const site = process.env.SITE_URL?.trim().replace(/\/+$/, '');
      await this.mail.send({
        to,
        subject: `${name} wrote you a testimonial`,
        text: `${name}${who ? ` (${who})` : ''} wrote:\n\n“${t.quote}”\n\nIt is hidden until you approve it in Admin → Testimonials.${site ? `\n${site}/admin` : ''}`,
      });
      return true;
    } catch (err) {
      this.logger.error(`Could not email testimonial alert: ${(err as Error).message}`);
      return false;
    }
  }

  private async usable(token: string, now: Date): Promise<TestimonialRequest> {
    const request = token.length <= 64 ? await this.requests.findOne({ where: { token } }) : null;
    if (!request) throw new NotFoundException('This link is not valid.');
    if (request.usedAt) throw new GoneException('This link has already been used. Thank you!');
    if (request.expiresAt <= now) throw new GoneException('This link has expired. Please ask for a new one.');
    return request;
  }
}
