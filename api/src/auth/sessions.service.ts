import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Not, Repository } from 'typeorm';
import { Session } from './session.entity';

/** How long a sign-in lasts; the access token gets the same lifetime. */
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
/** lastSeenAt is only written when it is at least this stale, so ordinary requests don't all write. */
const TOUCH_INTERVAL_MS = 60 * 1000;

export interface SessionInfo {
  id: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: Date;
  lastSeenAt: Date;
  current: boolean;
}

@Injectable()
export class SessionsService {
  constructor(@InjectRepository(Session) private readonly sessions: Repository<Session>) {}

  /** Starts a session, clearing this user's expired ones on the way. */
  async create(userId: string, userAgent?: string, ip?: string): Promise<Session> {
    const now = new Date();
    await this.sessions.delete({ userId, expiresAt: LessThan(now) });
    return this.sessions.save(
      this.sessions.create({
        userId,
        userAgent: userAgent?.slice(0, 300) || null,
        ip: ip?.slice(0, 64) || null,
        lastSeenAt: now,
        expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
      }),
    );
  }

  /** The live session with this id for this user, or null; marks it as seen. */
  async validate(id: string, userId: string): Promise<Session | null> {
    const session = await this.sessions.findOne({ where: { id, userId } });
    if (!session) return null;
    const now = new Date();
    if (session.expiresAt <= now) return null;
    if (now.getTime() - session.lastSeenAt.getTime() >= TOUCH_INTERVAL_MS) {
      session.lastSeenAt = now;
      await this.sessions.update({ id }, { lastSeenAt: now });
    }
    return session;
  }

  /** Live sessions, most recently used first. */
  async list(userId: string, currentId: string): Promise<SessionInfo[]> {
    const rows = await this.sessions.find({ where: { userId }, order: { lastSeenAt: 'DESC' } });
    const now = new Date();
    return rows
      .filter((s) => s.expiresAt > now)
      .map(({ id, userAgent, ip, createdAt, lastSeenAt }) => ({ id, userAgent, ip, createdAt, lastSeenAt, current: id === currentId }));
  }

  /** Ends one session; returns false if the user has no such session. */
  async revoke(userId: string, id: string): Promise<boolean> {
    const result = await this.sessions.delete({ userId, id });
    return (result.affected ?? 0) > 0;
  }

  /** Ends every session of the user except `keepId`; returns how many ended. */
  async revokeOthers(userId: string, keepId: string): Promise<number> {
    const result = await this.sessions.delete({ userId, id: Not(keepId) });
    return result.affected ?? 0;
  }
}
