import { BadRequestException, ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService, LOGIN_ATTEMPTS, PASSWORD_ATTEMPTS } from './auth.service';

describe('AuthService registration', () => {
  const users = { count: vi.fn(), findByEmail: vi.fn(), create: vi.fn() };
  const jwt = { sign: vi.fn(() => 'token') };
  const sessions = { create: vi.fn(async () => ({ id: 's1' })) };
  const env: Record<string, string | undefined> = {};
  const config = { get: vi.fn((k: string) => env[k]) };
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    delete env.ALLOW_REGISTRATION;
    users.findByEmail.mockResolvedValue(null);
    users.create.mockResolvedValue({ id: 'u1', email: 'owner@example.com' });
    service = new AuthService(users as any, jwt as any, config as any, sessions as any);
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
  const jwt = { sign: vi.fn() };
  const sessions = { revokeOthers: vi.fn(async () => 2) };
  let service: AuthService;
  let hash: string;

  beforeAll(async () => {
    hash = await bcrypt.hash('old-password', 4);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    users.findById.mockResolvedValue({ id: 'u1', email: 'owner@example.com', passwordHash: hash });
    service = new AuthService(users as any, jwt as any, { get: vi.fn() } as any, sessions as any);
  });

  it('saves the new hash and signs out every other session', async () => {
    await expect(service.changePassword('u1', 's1', 'old-password', 'new-password')).resolves.toEqual({ signedOut: 2 });
    const [id, newHash, changedAt] = users.setPassword.mock.calls[0];
    expect(id).toBe('u1');
    await expect(bcrypt.compare('new-password', newHash)).resolves.toBe(true);
    expect(changedAt).toBeInstanceOf(Date);
    expect(sessions.revokeOthers).toHaveBeenCalledWith('u1', 's1');
  });

  it('rejects a wrong current password, then rate limits', async () => {
    for (let i = 0; i < PASSWORD_ATTEMPTS; i++) {
      await expect(service.changePassword('u1', 's1', 'wrong', 'new-password')).rejects.toBeInstanceOf(BadRequestException);
    }
    await expect(service.changePassword('u1', 's1', 'wrong', 'new-password')).rejects.toMatchObject({ status: 429 });
    expect(users.setPassword).not.toHaveBeenCalled();
    expect(sessions.revokeOthers).not.toHaveBeenCalled();
  });

  it('rejects reusing the current password', async () => {
    await expect(service.changePassword('u1', 's1', 'old-password', 'old-password')).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('AuthService login', () => {
  const users = { findByEmail: vi.fn() };
  const jwt = { sign: vi.fn(() => 'token') };
  const sessions = { create: vi.fn(async () => ({ id: 's1' })) };
  let service: AuthService;
  let hash: string;

  beforeAll(async () => {
    hash = await bcrypt.hash('right-password', 4);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    users.findByEmail.mockImplementation(async (email: string) =>
      email === 'owner@example.com' ? { id: 'u1', email, passwordHash: hash } : null,
    );
    service = new AuthService(users as any, jwt as any, { get: vi.fn() } as any, sessions as any);
  });

  it('blocks an IP after too many failures, even with the right password', async () => {
    for (let i = 0; i < LOGIN_ATTEMPTS; i++) {
      const email = i % 2 ? 'owner@example.com' : 'nobody@example.com';
      await expect(service.login(email, 'wrong', { ip: '1.2.3.4' })).rejects.toBeInstanceOf(UnauthorizedException);
    }
    await expect(service.login('owner@example.com', 'right-password', { ip: '1.2.3.4' })).rejects.toMatchObject({ status: 429 });
    await expect(service.login('owner@example.com', 'right-password', { ip: '5.6.7.8' })).resolves.toEqual({ access_token: 'token' });
  });

  it('clears the count after a successful login', async () => {
    for (let i = 0; i < LOGIN_ATTEMPTS - 1; i++) {
      await expect(service.login('owner@example.com', 'wrong', { ip: '1.2.3.4' })).rejects.toBeInstanceOf(UnauthorizedException);
    }
    await service.login('owner@example.com', 'right-password', { ip: '1.2.3.4' });
    for (let i = 0; i < LOGIN_ATTEMPTS - 1; i++) {
      await expect(service.login('owner@example.com', 'wrong', { ip: '1.2.3.4' })).rejects.toBeInstanceOf(UnauthorizedException);
    }
    await expect(service.login('owner@example.com', 'right-password', { ip: '1.2.3.4' })).resolves.toEqual({ access_token: 'token' });
  });

  it('starts a session and puts its id in the token', async () => {
    await service.login('owner@example.com', 'right-password', { ip: '1.2.3.4', userAgent: 'Firefox' });
    expect(sessions.create).toHaveBeenCalledWith('u1', 'Firefox', '1.2.3.4');
    expect(jwt.sign).toHaveBeenCalledWith({ sub: 'u1', email: 'owner@example.com', sid: 's1' });
  });
});
