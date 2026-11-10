import { GoneException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestimonialRequestsService } from './testimonial-requests.service';

describe('TestimonialRequestsService', () => {
  const now = new Date('2026-11-10T12:00:00Z');
  const later = new Date('2026-11-20T12:00:00Z');
  const manager = {
    update: vi.fn(),
    create: vi.fn((_e, t) => t),
    save: vi.fn(async (t) => ({ id: 't1', ...t })),
    transaction: vi.fn(async (fn) => fn(manager)),
  };
  const requests = {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn((r) => r),
    save: vi.fn(async (r) => ({ id: 'r1', ...r })),
    delete: vi.fn(),
    manager,
  };
  const profiles = { findOne: vi.fn() };
  const mail = { enabled: true, notifyTo: null as string | null, send: vi.fn() };
  let service: TestimonialRequestsService;

  const open = { id: 'r1', token: 'tok', recipientName: 'Ada', note: 'Thanks!', expiresAt: later, usedAt: null };
  const form = { name: ' Ada Lovelace ', role: ' Manager ', company: '', quote: '  Great engineer.  ', linkUrl: 'https://linkedin.com/in/ada' };

  beforeEach(() => {
    vi.clearAllMocks();
    requests.findOne.mockResolvedValue(open);
    profiles.findOne.mockResolvedValue({ name: 'Alonnah', headline: 'Engineer', email: 'owner@site.dev' });
    mail.enabled = true;
    mail.send.mockResolvedValue(undefined);
    manager.update.mockResolvedValue({ affected: 1 });
    service = new TestimonialRequestsService(requests as any, profiles as any, mail as any);
  });

  it('creates an unguessable 30-day link', async () => {
    const r = await service.create({ recipientName: '  ', note: ' Hi ' }, now);
    expect(r.token).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(r.recipientName).toBeNull();
    expect(r.note).toBe('Hi');
    expect(r.expiresAt.toISOString()).toBe('2026-12-10T12:00:00.000Z');
    const other = await service.create({}, now);
    expect(other.token).not.toBe(r.token);
  });

  it('greets with the note and owner, without exposing the request', async () => {
    await expect(service.invite('tok', now)).resolves.toEqual({ recipientName: 'Ada', note: 'Thanks!', ownerName: 'Alonnah', ownerHeadline: 'Engineer' });
  });

  it('rejects unknown, used and expired links', async () => {
    requests.findOne.mockResolvedValueOnce(null);
    await expect(service.invite('nope', now)).rejects.toBeInstanceOf(NotFoundException);
    requests.findOne.mockResolvedValueOnce({ ...open, usedAt: now });
    await expect(service.invite('tok', now)).rejects.toBeInstanceOf(GoneException);
    requests.findOne.mockResolvedValueOnce({ ...open, expiresAt: now });
    await expect(service.invite('tok', now)).rejects.toThrow(/expired/);
    await expect(service.invite('x'.repeat(65), now)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('saves a hidden, trimmed testimonial and uses up the link', async () => {
    const t = await service.submit('tok', form, now);
    expect(t).toMatchObject({ name: 'Ada Lovelace', role: 'Manager', company: null, quote: 'Great engineer.', published: false, submitted: true, avatarUrl: null });
    expect(manager.update).toHaveBeenNthCalledWith(1, expect.anything(), expect.objectContaining({ id: 'r1' }), { usedAt: now });
    expect(manager.update).toHaveBeenNthCalledWith(2, expect.anything(), { id: 'r1' }, { testimonialId: 't1' });
  });

  it('lets only one of two simultaneous submissions through', async () => {
    manager.update.mockResolvedValueOnce({ affected: 0 });
    await expect(service.submit('tok', form, now)).rejects.toBeInstanceOf(GoneException);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('drops honeypot submissions without using the link', async () => {
    await expect(service.submit('tok', { ...form, website: 'http://spam' }, now)).resolves.toBeNull();
    expect(manager.transaction).not.toHaveBeenCalled();
  });

  it('emails the owner about a new testimonial, and survives mail errors', async () => {
    await service.submit('tok', form, now);
    await vi.waitFor(() => expect(mail.send).toHaveBeenCalled());
    expect(mail.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'owner@site.dev', subject: 'Ada Lovelace wrote you a testimonial', text: expect.stringContaining('“Great engineer.”') }),
    );
    mail.send.mockRejectedValueOnce(new Error('down'));
    await expect(service.notifyOwner({ name: 'A', role: null, company: null, quote: 'q' })).resolves.toBe(false);
    mail.enabled = false;
    await expect(service.notifyOwner({ name: 'A', role: null, company: null, quote: 'q' })).resolves.toBe(false);
  });
});
