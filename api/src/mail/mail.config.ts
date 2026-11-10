import type SMTPTransport from 'nodemailer/lib/smtp-transport';

export interface MailConfig {
  transport: SMTPTransport.Options;
  /** Sender address, e.g. "Portfolio <alerts@yourname.dev>". */
  from: string;
  /** Where alerts go when set; otherwise callers fall back to e.g. the profile email. */
  notifyTo: string | null;
}

/**
 * Reads SMTP settings from the environment. Returns null when SMTP_HOST isn't set,
 * which turns email off rather than failing.
 */
export function readMailConfig(env: NodeJS.ProcessEnv = process.env): MailConfig | null {
  const host = env.SMTP_HOST?.trim();
  if (!host) return null;
  const port = parseInt(env.SMTP_PORT || '587', 10);
  const user = env.SMTP_USER?.trim();
  const secureSetting = env.SMTP_SECURE?.trim().toLowerCase();
  return {
    transport: {
      host,
      port,
      // Port 465 is implicit TLS; others (587, 25) upgrade with STARTTLS.
      secure: secureSetting ? secureSetting === 'true' : port === 465,
      auth: user ? { user, pass: env.SMTP_PASS ?? '' } : undefined,
    },
    from: env.MAIL_FROM?.trim() || user || `portfolio@${host}`,
    notifyTo: env.NOTIFY_EMAIL?.trim() || null,
  };
}
