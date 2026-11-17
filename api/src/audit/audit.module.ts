import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AuditEvent } from './audit-event.entity';
import { AuditController } from './audit.controller';
import { AuditInterceptor } from './audit.interceptor';
import { AuditService } from './audit.service';

/** The Admin activity log. Global so any module can record events. */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditEvent]), AuthModule],
  providers: [AuditService, { provide: APP_INTERCEPTOR, useClass: AuditInterceptor }],
  controllers: [AuditController],
  exports: [AuditService],
})
export class AuditModule {}
