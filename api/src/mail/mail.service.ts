import { Injectable, Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import { readMailConfig, type MailConfig } from './mail.config';

export interface OutgoingMail {
  to: string;
  subject: string;
  text: string;
  /** Lets "Reply" in the mail app go to e.g. the visitor instead of the sender address. */
  replyTo?: string;
}

/** Sends email over SMTP when configured; a no-op otherwise. */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly config: MailConfig | null;
  private transporter: Transporter | null = null;

  constructor(config?: MailConfig | null, private readonly makeTransport: typeof createTransport = createTransport) {
    this.config = config === undefined ? readMailConfig() : config;
    if (!this.config) this.logger.log('SMTP_HOST is not set, so email alerts are off.');
  }

  get enabled(): boolean {
    return this.config !== null;
  }

  /** The configured alert recipient (NOTIFY_EMAIL), if any. */
  get notifyTo(): string | null {
    return this.config?.notifyTo ?? null;
  }

  /** Sends one email. Throws on SMTP errors so callers can decide whether that matters. */
  async send(mail: OutgoingMail): Promise<void> {
    if (!this.config) throw new Error('Email is not configured (SMTP_HOST is not set).');
    this.transporter ??= this.makeTransport(this.config.transport);
    await this.transporter.sendMail({ from: this.config.from, ...mail });
  }
}
