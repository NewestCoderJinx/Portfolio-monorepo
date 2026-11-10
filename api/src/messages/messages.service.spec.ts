import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessagesService, newMessageEmail } from './messages.service';

describe('MessagesService', () => {
  const repo = { create: vi.fn((m) => m), save: vi.fn(async (m) => m), findOne: vi.fn(), delete: vi.fn(), update: vi.fn() };
  const profiles = { findOne: vi.fn() };
  const mail = { enabled: true, notifyTo: null as string | null, send: vi.fn() };
  let service: MessagesService;

  beforeEach(() => {
    vi.clearAllMocks();
    mail.enabled = true;
    mail.notifyTo = null;
    profiles.findOne.mockResolvedValue({ email: 'owner@site.dev' });
    mail.send.mockResolvedValue(undefined);
    service = new MessagesService(repo as any, profiles as any, mail as any);
  });

  it('stores a trimmed message', async () => {
    await service.receive({ name: ' Ada ', email: 'ada@example.com ', body: '  Hello, I have a role for you.  ' });
    expect(repo.save).toHaveBeenCalledWith({ name: 'Ada', email: 'ada@example.com', body: 'Hello, I have a role for you.' });
  });

  it('silently drops honeypot submissions', async () => {
    await service.receive({ name: 'Bot', email: 'bot@spam.com', body: 'Buy cheap stuff now!!', website: 'http://spam' });
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('updates only the flags given and 404s on unknown ids', async () => {
    repo.findOne.mockResolvedValueOnce({ id: 'm1', read: false, archived: false, repliedAt: null });
    await expect(service.update('m1', { archived: true })).resolves.toEqual({ id: 'm1', read: false, archived: true, repliedAt: null });
    repo.findOne.mockResolvedValueOnce(null);
    await expect(service.update('nope', { read: true })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('records a reply once, marks the message read, and can clear it', async () => {
    const first = new Date('2026-01-01T10:00:00Z');
    repo.findOne.mockResolvedValueOnce({ id: 'm1', read: false, repliedAt: null });
    const replied = await service.update('m1', { replied: true });
    expect(replied.read).toBe(true);
    expect(replied.repliedAt).toBeInstanceOf(Date);

    repo.findOne.mockResolvedValueOnce({ id: 'm1', read: true, repliedAt: first });
    await expect(service.update('m1', { replied: true })).resolves.toMatchObject({ repliedAt: first });

    repo.findOne.mockResolvedValueOnce({ id: 'm1', read: true, repliedAt: first });
    await expect(service.update('m1', { replied: false })).resolves.toMatchObject({ repliedAt: null });
  });

  it('marks only unread, non-archived messages read in bulk', async () => {
    repo.update.mockResolvedValueOnce({ affected: 3 });
    await expect(service.markAllRead()).resolves.toBe(3);
    expect(repo.update).toHaveBeenCalledWith({ read: false, archived: false }, { read: true });
  });

  describe('new message alerts', () => {
    const msg = { name: 'Ada', email: 'ada@example.com', body: 'Hello, I have a role for you.' };

    it('emails the profile address with Reply-To set to the visitor', async () => {
      await expect(service.notify(msg)).resolves.toBe(true);
      expect(mail.send).toHaveBeenCalledWith(expect.objectContaining({ to: 'owner@site.dev', replyTo: 'ada@example.com' }));
    });

    it('prefers NOTIFY_EMAIL over the profile email', async () => {
      mail.notifyTo = 'alerts@site.dev';
      await service.notify(msg);
      expect(profiles.findOne).not.toHaveBeenCalled();
      expect(mail.send).toHaveBeenCalledWith(expect.objectContaining({ to: 'alerts@site.dev' }));
    });

    it('does nothing when email is off or there is no recipient', async () => {
      mail.enabled = false;
      await expect(service.notify(msg)).resolves.toBe(false);
      mail.enabled = true;
      profiles.findOne.mockResolvedValue({ email: null });
      await expect(service.notify(msg)).resolves.toBe(false);
      expect(mail.send).not.toHaveBeenCalled();
    });

    it('swallows SMTP errors', async () => {
      mail.send.mockRejectedValue(new Error('connection refused'));
      await expect(service.notify(msg)).resolves.toBe(false);
    });

    it('receive() saves first and still succeeds when the alert fails', async () => {
      mail.send.mockRejectedValue(new Error('down'));
      await expect(service.receive(msg)).resolves.toBeUndefined();
      expect(repo.save).toHaveBeenCalled();
    });

    it('formats the alert, keeping newlines out of the subject', () => {
      const email = newMessageEmail({ ...msg, name: 'Ada\r\nBcc: x@y.z' }, 'https://ada.dev');
      expect(email.subject).toBe('New message from Ada Bcc: x@y.z via your portfolio');
      expect(email.text).toContain('Hello, I have a role for you.');
      expect(email.text).toContain('https://ada.dev/admin');
    });
  });
});
