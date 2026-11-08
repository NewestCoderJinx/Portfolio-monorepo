import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService, PASSWORD_ATTEMPTS } from './auth.service';
import { isRevoked } from './jwt.strategy';

describe('AuthService registration', () => {
  const users = { count: vi.fn(), findByEmail: vi.fn(), create: vi.fn() };
  const jwt = { sign: vi.fn(() => 'token') };
  const env: Record<string, string | undefined> = {};
  const config = { get: vi.fn((k: string) => env[k]) };
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    delete env.ALLOW_REGISTRATION;
    users.findByEmail.mockResolvedValue(null);
    users.create.mockResolvedValue({ id: 'u1', email: 'owner@example.com' });
    service = new AuthService(users as any, jwt as any, config as any);
  });

  it('lets the first user register', async () => {
    users.count.mockResolvedValue(0);
    await expect(service.register('owner@example.com', 'secret123')).resolves.toEqual({ access_token: 'token' });
  });

  it('closes registration once an account exists', async () => {
    users.count.mockResolvedValue(1);
    await expect(service.isRegistrationOpen()).resolves.toBe(false);
    await expect(service.register('intruder@example.com', 'secret123')).rejects.toBeInstanceOf(ForbiddenException);
    expect(users.create).not.toHaveBeenCalled();
  });

  it('can be reopened with ALLOW_REGISTRATION=true', async () => {
    users.count.mockResolvedValue(3);
    env.ALLOW_REGISTRATION = 'true';
    await expect(service.isRegistrationOpen()).resolves.toBe(true);
  });

  it('still rejects duplicate emails while open', async () => {
    users.count.mockResolvedValue(0);
    users.findByEmail.mockResolvedValue({ id: 'u1' });
    await expect(service.register('owner@example.com', 'secret123')).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('AuthService password change', () => {
  const users = { findById: vi.fn(), setPassword: vi.fn() };
  const jwt = { sign: vi.fn(() => 'fresh-token') };
  let service: AuthService;
  let hash: string;

  beforeAll(async () => {
    hash = await bcrypt.hash('old-password', 4);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    users.findById.mockResolvedValue({ id: 'u1', email: 'owner@example.com', passwordHash: hash });
    service = new AuthService(users as any, jwt as any, { get: vi.fn() } as any);
  });

  it('saves the new hash, records the change time and returns a fresh token', async () => {
    await expect(service.changePassword('u1', 'old-password', 'new-password')).resolves.toEqual({ access_token: 'fresh-token' });
    const [id, newHash, changedAt] = users.setPassword.mock.calls[0];
    expect(id).toBe('u1');
    await expect(bcrypt.compare('new-password', newHash)).resolves.toBe(true);
    expect(changedAt.getTime() % 1000).toBe(0);
  });

  it('rejects a wrong current password, then rate limits', async () => {
    for (let i = 0; i < PASSWORD_ATTEMPTS; i++) {
      await expect(service.changePassword('u1', 'wrong', 'new-password')).rejects.toBeInstanceOf(BadRequestException);
    }
    await expect(service.changePassword('u1', 'wrong', 'new-password')).rejects.toMatchObject({ status: 429 });
    expect(users.setPassword).not.toHaveBeenCalled();
  });

  it('rejects reusing the current password', async () => {
    await expect(service.changePassword('u1', 'old-password', 'old-password')).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('isRevoked', () => {
  const changed = new Date('2026-01-01T00:00:10Z');
  it('accepts tokens issued at or after the change, rejects older ones', () => {
    expect(isRevoked(undefined, null)).toBe(false);
    expect(isRevoked(changed.getTime() / 1000, changed)).toBe(false);
    expect(isRevoked(changed.getTime() / 1000 - 1, changed)).toBe(true);
    expect(isRevoked(undefined, changed)).toBe(true);
  });
});
