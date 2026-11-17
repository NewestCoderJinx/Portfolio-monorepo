import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { Observable, tap } from 'rxjs';
import type { AuthUser } from '../auth/jwt.strategy';
import { AuditService } from './audit.service';

const WRITES = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** A readable name for what was saved, taken from the response (e.g. a project's title). */
export function labelFor(body: unknown): string | undefined {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return undefined;
  const b = body as Record<string, unknown>;
  const pick = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 120) : undefined);
  return pick(b.title) ?? pick(b.name) ?? pick(b.recipientName) ?? (pick(b.role) && pick(b.company) ? `${pick(b.role)} at ${pick(b.company)}` : undefined);
}

const idOf = (body: unknown) => (body && typeof body === 'object' && typeof (body as { id?: unknown }).id === 'string' ? (body as { id: string }).id : undefined);

/**
 * Records every successful write made by a signed-in admin (projects, posts, skills…), so new admin
 * routes are covered without extra code. Auth routes log their own, more specific events.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const req = context.switchToHttp().getRequest<Request>();
    return next.handle().pipe(
      tap((body) => {
        const user = req.user as AuthUser | undefined;
        const route: string | undefined = req.route?.path;
        if (!user || !WRITES.has(req.method) || !route || route.startsWith('/auth')) return;
        void this.audit.record({
          action: 'content.change',
          userId: user.userId,
          ip: req.ip?.replace(/^::ffff:/, ''),
          userAgent: req.get('user-agent'),
          detail: { method: req.method, route, id: req.params?.id ?? idOf(body), label: labelFor(body) },
        });
      }),
    );
  }
}
