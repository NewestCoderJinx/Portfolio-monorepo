import { ConflictException, ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';

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
