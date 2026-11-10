import { describe, expect, it, vi } from 'vitest';
import { readMailConfig } from './mail.config';
import { MailService } from './mail.service';

describe('readMailConfig', () => {
  it('turns email off without SMTP_HOST', () => {
    expect(readMailConfig({})).toBeNull();
    expect(readMailConfig({ SMTP_HOST: '  ' })).toBeNull();
  });

  it('defaults to port 587 with STARTTLS and the user as sender', () => {
    expect(readMailConfig({ SMTP_HOST: 'smtp.x.com', SMTP_USER: 'me@x.com', SMTP_PASS: 'pw' })).toEqual({
      transport: { host: 'smtp.x.com', port: 587, secure: false, auth: { user: 'me@x.com', pass: 'pw' } },
      from: 'me@x.com',
      notifyTo: null,
    });
  });

  it('uses implicit TLS on 465 unless SMTP_SECURE says otherwise, and reads MAIL_FROM/NOTIFY_EMAIL', () => {
    const c = readMailConfig({ SMTP_HOST: 'h', SMTP_PORT: '465', MAIL_FROM: 'Site <a@b.c>', NOTIFY_EMAIL: ' me@b.c ' })!;
    expect(c.transport.secure).toBe(true);
    expect(c.transport.auth).toBeUndefined();
    expect(c.from).toBe('Site <a@b.c>');
    expect(c.notifyTo).toBe('me@b.c');
    expect(readMailConfig({ SMTP_HOST: 'h', SMTP_PORT: '465', SMTP_SECURE: 'false' })!.transport.secure).toBe(false);
  });
});

describe('MailService', () => {
  it('refuses to send when not configured', async () => {
    const mail = new MailService(null);
    expect(mail.enabled).toBe(false);
    await expect(mail.send({ to: 'a@b.c', subject: 's', text: 't' })).rejects.toThrow(/not configured/);
  });

  it('creates the transport once and sends from the configured address', async () => {
    const sendMail = vi.fn().mockResolvedValue({});
    const make = vi.fn(() => ({ sendMail }) as any);
    const mail = new MailService({ transport: { host: 'h' }, from: 'site@x.com', notifyTo: null }, make);
    await mail.send({ to: 'me@x.com', subject: 'Hi', text: 'Body', replyTo: 'v@y.com' });
    await mail.send({ to: 'me@x.com', subject: 'Again', text: 'Body' });
    expect(make).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenNthCalledWith(1, { from: 'site@x.com', to: 'me@x.com', subject: 'Hi', text: 'Body', replyTo: 'v@y.com' });
  });
});
