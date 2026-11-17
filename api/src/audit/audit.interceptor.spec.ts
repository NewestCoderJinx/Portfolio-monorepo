import { lastValueFrom, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AuditInterceptor, labelFor } from './audit.interceptor';

const run = async (req: Record<string, unknown>, body: unknown = { id: 'p1', title: 'Portfolio' }) => {
  const audit = { record: vi.fn() };
  const context = { getType: () => 'http', switchToHttp: () => ({ getRequest: () => ({ get: () => 'UA', ip: '::ffff:1.2.3.4', params: {}, ...req }) }) };
  await lastValueFrom(new AuditInterceptor(audit as any).intercept(context as any, { handle: () => of(body) }));
  return audit.record;
};

describe('AuditInterceptor', () => {
  const user = { userId: 'u1' };

  it('records a signed-in write with a readable label', async () => {
    const record = await run({ user, method: 'PATCH', route: { path: '/projects/:id' }, params: { id: 'p1' } });
    expect(record).toHaveBeenCalledWith({
      action: 'content.change',
      userId: 'u1',
      ip: '1.2.3.4',
      userAgent: 'UA',
      detail: { method: 'PATCH', route: '/projects/:id', id: 'p1', label: 'Portfolio' },
    });
  });

  it('takes the id of a new item from the response', async () => {
    const record = await run({ user, method: 'POST', route: { path: '/projects' } });
    expect(record.mock.calls[0][0].detail).toMatchObject({ id: 'p1', label: 'Portfolio' });
  });

  it('skips reads, public writes and auth routes', async () => {
    expect(await run({ user, method: 'GET', route: { path: '/projects' } })).not.toHaveBeenCalled();
    expect(await run({ method: 'POST', route: { path: '/messages' } })).not.toHaveBeenCalled();
    expect(await run({ user, method: 'PATCH', route: { path: '/auth/password' } })).not.toHaveBeenCalled();
  });
});

describe('labelFor', () => {
  it('picks the most descriptive field', () => {
    expect(labelFor({ title: 'Post' })).toBe('Post');
    expect(labelFor({ name: 'TypeScript' })).toBe('TypeScript');
    expect(labelFor({ role: 'Engineer', company: 'Acme' })).toBe('Engineer at Acme');
    expect(labelFor([{ title: 'x' }])).toBeUndefined();
    expect(labelFor(undefined)).toBeUndefined();
  });
});
