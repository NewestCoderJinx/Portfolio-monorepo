import API from './axios';

export type AuditKind = 'all' | 'security' | 'content';

export interface AuditEvent {
  id: string;
  createdAt: string;
  action: string;
  userId: string | null;
  email: string | null;
  ip: string | null;
  userAgent: string | null;
  detail: Record<string, unknown> | null;
}

/** Newest first; pass the last event's createdAt as `before` for the next page. */
export const getAuditEvents = async (kind: AuditKind, before?: string, limit = 50): Promise<AuditEvent[]> =>
  (await API.get<AuditEvent[]>('/audit', { params: { kind, before, limit } })).data;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

const RESOURCES: Record<string, string> = {
  projects: 'project',
  posts: 'post',
  skills: 'skill',
  experience: 'experience entry',
  credentials: 'education entry',
  testimonials: 'testimonial',
  'testimonial-requests': 'testimonial request link',
  messages: 'message',
  profile: 'profile',
};

/** Routes whose meaning isn't just "verb + resource". */
const SPECIAL: Record<string, string> = {
  'PATCH /projects/reorder': 'Reordered projects',
  'PATCH /skills/reorder': 'Reordered skills',
  'POST /projects/upload': 'Uploaded an image',
  'POST /profile/resume': 'Uploaded a résumé',
  'PATCH /messages/read-all': 'Marked every message read',
  'POST /messages/alerts/test': 'Sent a test email alert',
};

function describeChange(detail: Record<string, unknown>): string {
  const method = String(detail.method ?? '');
  const route = String(detail.route ?? '');
  const special = SPECIAL[`${method} ${route}`];
  if (special) return special;
  const resource = RESOURCES[route.split('/')[1]] ?? route;
  const verb = method === 'POST' ? 'Created' : method === 'DELETE' ? 'Deleted' : 'Updated';
  const label = typeof detail.label === 'string' ? ` “${detail.label}”` : '';
  if (resource === 'profile') return 'Updated the profile';
  return label ? `${verb} ${resource}${label}` : `${verb} a ${resource}`;
}

export type AuditTone = 'normal' | 'failed' | 'blocked' | 'notice';

/** A sentence for the activity list, and whether it's worth highlighting. */
export function describeAuditEvent(e: AuditEvent): { text: string; tone: AuditTone } {
  const d = e.detail ?? {};
  const n = (k: string) => Number(d[k] ?? 0);
  switch (e.action) {
    case 'auth.login':
      return { text: d.twoFactor === 'recovery' ? 'Signed in with a recovery code' : d.twoFactor ? 'Signed in with password and code' : 'Signed in', tone: 'normal' };
    case 'auth.login_failed':
      return { text: `Failed sign-in${e.email ? ` as ${e.email}` : ''}`, tone: 'failed' };
    case 'auth.login_blocked':
      return { text: 'Sign-in blocked after too many failures', tone: 'blocked' };
    case 'auth.code_failed':
      return { text: 'Wrong verification code', tone: 'failed' };
    case 'auth.recovery_code_used':
      return { text: `Used a recovery code (${n('left')} left)`, tone: 'notice' };
    case 'auth.logout':
      return { text: 'Signed out', tone: 'normal' };
    case 'auth.register':
      return { text: 'Created the owner account', tone: 'normal' };
    case 'auth.password_changed':
      return { text: n('signedOut') ? `Changed password and signed out ${plural(n('signedOut'), 'other session')}` : 'Changed password', tone: 'normal' };
    case 'auth.session_revoked':
      return { text: 'Signed out another session', tone: 'normal' };
    case 'auth.other_sessions_revoked':
      return { text: `Signed out ${plural(n('signedOut'), 'other session')}`, tone: 'normal' };
    case 'auth.2fa_enabled':
      return { text: 'Turned on two-step verification', tone: 'normal' };
    case 'auth.2fa_disabled':
      return { text: 'Turned off two-step verification', tone: 'notice' };
    case 'auth.recovery_codes_regenerated':
      return { text: 'Made new recovery codes', tone: 'normal' };
    case 'content.change':
      return { text: describeChange(d), tone: 'normal' };
    default:
      return { text: e.action, tone: 'normal' };
  }
}
