import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { AuditEvent, type AuditAction } from './audit-event.entity';

export const AUDIT_RETENTION_DAYS = 90;
const PRUNE_INTERVAL_MS = 60 * 60 * 1000;

export interface AuditEntry {
  action: AuditAction;
  userId?: string | null;
  email?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  detail?: Record<string, unknown> | null;
}

export type AuditKind = 'all' | 'security' | 'content';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private lastPrune = 0;

  constructor(@InjectRepository(AuditEvent) private readonly events: Repository<AuditEvent>) {}

  /** Saves an event. Never throws: a logging failure must not break the action being logged. */
  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.events.insert({
        action: entry.action,
        userId: entry.userId ?? null,
        email: entry.email?.slice(0, 200) ?? null,
        ip: entry.ip?.slice(0, 64) ?? null,
        userAgent: entry.userAgent?.slice(0, 300) ?? null,
        detail: entry.detail ?? null,
      });
      await this.pruneOccasionally();
    } catch (err) {
      this.logger.error(`Could not record ${entry.action}: ${(err as Error).message}`);
    }
  }

  /** Newest first; pass the last createdAt seen as `before` to page back. */
  async list(kind: AuditKind = 'all', limit = 50, before?: Date): Promise<AuditEvent[]> {
    const qb = this.events.createQueryBuilder('e').orderBy('e.createdAt', 'DESC').take(Math.min(Math.max(limit, 1), 200));
    if (before) qb.andWhere('e.createdAt < :before', { before });
    if (kind === 'security') qb.andWhere("e.action LIKE 'auth.%'");
    if (kind === 'content') qb.andWhere('e.action = :a', { a: 'content.change' });
    return qb.getMany();
  }

  private async pruneOccasionally() {
    const now = Date.now();
    if (now - this.lastPrune < PRUNE_INTERVAL_MS) return;
    this.lastPrune = now;
    await this.events.delete({ createdAt: LessThan(new Date(now - AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000)) });
  }
}
