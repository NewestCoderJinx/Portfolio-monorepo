import { BadRequestException, ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { JwtService } from '@nestjs/jwt';
import { AuthService, CODE_ATTEMPTS, LOGIN_ATTEMPTS, PASSWORD_ATTEMPTS } from './auth.service';
import { base32Decode, currentStep, totpAt } from './totp';

const audit = { record: vi.fn(async () => undefined) };
const loggedActions = () => audit.record.mock.calls.map(([e]: any[]) => e.action);

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
    service = new AuthService(users as any, jwt as any, config as any, sessions as any, audit as any);
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
    service = new AuthService(users as any, jwt as any, { get: vi.fn() } as any, sessions as any, audit as any);
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
    service = new AuthService(users as any, jwt as any, { get: vi.fn() } as any, sessions as any, audit as any);
  });

  it('blocks an IP after too many failures, even with the right password', async () => {
    for (let i = 0; i < LOGIN_ATTEMPTS; i++) {
      const email = i % 2 ? 'owner@example.com' : 'nobody@example.com';
      await expect(service.login(email, 'wrong', { ip: '1.2.3.4' })).rejects.toBeInstanceOf(UnauthorizedException);
    }
    await expect(service.login('owner@example.com', 'right-password', { ip: '1.2.3.4' })).rejects.toMatchObject({ status: 429 });
    await expect(service.login('owner@example.com', 'right-password', { ip: '5.6.7.8' })).resolves.toEqual({ access_token: 'token' });
  });

  it('logs failed, blocked and successful sign-ins with the typed email', async () => {
    await expect(service.login('nobody@example.com', 'wrong', { ip: '9.9.9.9' })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(audit.record).toHaveBeenLastCalledWith(expect.objectContaining({ action: 'auth.login_failed', email: 'nobody@example.com', ip: '9.9.9.9' }));
    await service.login('owner@example.com', 'right-password', { ip: '9.9.9.9' });
    expect(audit.record).toHaveBeenLastCalledWith(expect.objectContaining({ action: 'auth.login', userId: 'u1' }));
    for (let i = 0; i < LOGIN_ATTEMPTS; i++) await service.login('owner@example.com', 'wrong', { ip: '8.8.8.8' }).catch(() => undefined);
    await service.login('owner@example.com', 'right-password', { ip: '8.8.8.8' }).catch(() => undefined);
    expect(loggedActions().slice(-1)[0]).toBe('auth.login_blocked');
    for (const [entry] of audit.record.mock.calls as any[]) expect(JSON.stringify(entry)).not.toContain('password');
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

describe('AuthService two-step verification', () => {
  let user: Record<string, any>;
  const users = {
    findByEmail: vi.fn(async () => user),
    findById: vi.fn(async () => user),
    update: vi.fn(async (_id: string, changes: Record<string, unknown>) => Object.assign(user, changes)),
  };
  const jwt = new JwtService({ secret: 'test-secret' });
  const sessions = { create: vi.fn(async () => ({ id: '6f1c3c3e-8f7b-4a43-9d2e-2b4f6f0f6a10' })) };
  let service: AuthService;
  let hash: string;
  const codeNow = () => totpAt(base32Decode(user.totpSecret), currentStep());

  beforeAll(async () => {
    hash = await bcrypt.hash('right-password', 4);
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    user = { id: 'u1', email: 'owner@example.com', passwordHash: hash, totpSecret: null, totpEnabledAt: null, totpLastUsedStep: null, totpRecoveryCodes: null };
    service = new AuthService(users as any, jwt, { get: vi.fn() } as any, sessions as any, audit as any);
  });

  const turnOn = async () => {
    const { otpauthUrl } = await service.setupTwoFactor('u1');
    expect(otpauthUrl).toContain(`secret=${user.totpSecret}`);
    expect(user.totpEnabledAt).toBeNull();
    return (await service.enableTwoFactor('u1', codeNow())).recoveryCodes;
  };

  it('only turns on after a valid code, and returns ten recovery codes', async () => {
    await service.setupTwoFactor('u1');
    await expect(service.enableTwoFactor('u1', '000000')).rejects.toBeInstanceOf(BadRequestException);
    expect(user.totpEnabledAt).toBeNull();
    const codes = await service.enableTwoFactor('u1', codeNow());
    expect(codes.recoveryCodes).toHaveLength(10);
    expect(user.totpEnabledAt).toBeInstanceOf(Date);
    expect(user.totpRecoveryCodes).not.toContain(codes.recoveryCodes[0]);
  });

  it('asks for a code after the password, then signs in with it', async () => {
    await turnOn();
    user.totpLastUsedStep = null; // the enabling code would otherwise block reuse within the same step
    const first = await service.login('owner@example.com', 'right-password', { ip: '1.2.3.4' });
    expect(first).toMatchObject({ twoFactorRequired: true });
    expect(sessions.create).not.toHaveBeenCalled();
    const { challenge } = first as { challenge: string };
    const result = await service.loginWithCode(challenge, codeNow(), { ip: '1.2.3.4' });
    expect(result).toHaveProperty('access_token');
    await expect(service.loginWithCode(challenge, codeNow(), { ip: '1.2.3.4' })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('accepts each recovery code once', async () => {
    const [code] = await turnOn();
    const { challenge } = (await service.login('owner@example.com', 'right-password')) as { challenge: string };
    await expect(service.loginWithCode(challenge, code.toUpperCase())).resolves.toHaveProperty('access_token');
    expect(user.totpRecoveryCodes).toHaveLength(9);
    expect(loggedActions().slice(-2)).toEqual(['auth.recovery_code_used', 'auth.login']);
    await expect(service.loginWithCode(challenge, code)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refuses a challenge that is not one, or an access token in its place', async () => {
    await turnOn();
    await expect(service.loginWithCode('garbage', '123456')).rejects.toBeInstanceOf(UnauthorizedException);
    const accessLike = jwt.sign({ sub: 'u1', email: 'owner@example.com', sid: 'x' });
    await expect(service.loginWithCode(accessLike, codeNow())).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('locks code entry after too many wrong codes', async () => {
    await turnOn();
    user.totpLastUsedStep = null;
    const { challenge } = (await service.login('owner@example.com', 'right-password')) as { challenge: string };
    for (let i = 0; i < CODE_ATTEMPTS; i++) {
      await expect(service.loginWithCode(challenge, '000000', { ip: `10.0.0.${i}` })).rejects.toBeInstanceOf(UnauthorizedException);
    }
    await expect(service.loginWithCode(challenge, codeNow(), { ip: '10.0.0.99' })).rejects.toMatchObject({ status: 429 });
    expect(loggedActions().filter((a) => a === 'auth.code_failed')).toHaveLength(CODE_ATTEMPTS);
  });

  it('turns off only with the password and a code', async () => {
    const [recovery] = await turnOn();
    await expect(service.disableTwoFactor('u1', 'wrong-password', recovery)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.disableTwoFactor('u1', 'right-password', 'zzzzz-zzzzz')).rejects.toBeInstanceOf(BadRequestException);
    expect(user.totpEnabledAt).toBeInstanceOf(Date);
    await service.disableTwoFactor('u1', 'right-password', recovery);
    expect(loggedActions()).toContain('auth.2fa_enabled');
    expect(loggedActions().slice(-1)[0]).toBe('auth.2fa_disabled');
    expect(user).toMatchObject({ totpSecret: null, totpEnabledAt: null, totpRecoveryCodes: null });
    await expect(service.login('owner@example.com', 'right-password')).resolves.toHaveProperty('access_token');
  });
});
