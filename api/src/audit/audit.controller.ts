import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditService, type AuditKind } from './audit.service';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  /** Newest first. `before` (an ISO date from the last row) pages back; `kind` is all, security or content. */
  @Get()
  list(@Query('kind') kind?: string, @Query('before') before?: string, @Query('limit') limit?: string) {
    const k: AuditKind = kind === 'security' || kind === 'content' ? kind : 'all';
    const beforeDate = before ? new Date(before) : undefined;
    if (beforeDate && Number.isNaN(beforeDate.getTime())) throw new BadRequestException('before must be a date');
    return this.audit.list(k, limit ? parseInt(limit, 10) || 50 : 50, beforeDate);
  }
}
