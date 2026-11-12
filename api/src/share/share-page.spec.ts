import { afterEach, describe, expect, it } from 'vitest';
import { absoluteUrl, markdownToText, renderSharePage, summarize } from './share-page';
import { siteUrl } from './share.controller';

const base = {
  title: 'Queue Service | Ada',
  shareUrl: 'https://ada.dev/p/1',
  targetUrl: 'https://ada.dev/#project-1',
};

describe('renderSharePage', () => {
  it('includes the preview tags and forwards to the case study', () => {
    const html = renderSharePage({ ...base, description: 'Handles  10k jobs/s.', image: 'https://ada.dev/uploads/a.png', siteName: 'Ada' });
    expect(html).toContain('<meta property="og:title" content="Queue Service | Ada" />');
    expect(html).toContain('<meta property="og:description" content="Handles 10k jobs/s." />');
    expect(html).toContain('<meta property="og:image" content="https://ada.dev/uploads/a.png" />');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(html).toContain('<meta property="og:url" content="https://ada.dev/p/1" />');
    expect(html).toContain('<meta http-equiv="refresh" content="0; url=https://ada.dev/#project-1" />');
    expect(html).toContain('window.location.replace("https://ada.dev/#project-1")');
  });

  it('falls back to a text card and skips empty tags', () => {
    const html = renderSharePage(base);
    expect(html).toContain('<meta name="twitter:card" content="summary" />');
    expect(html).not.toContain('og:image');
    expect(html).not.toContain('og:description');
  });

  it('escapes text so it cannot break out of attributes or the script', () => {
    const html = renderSharePage({ ...base, title: '"><script>alert(1)</script>', targetUrl: 'https://ada.dev/#</script><script>x()' });
    expect(html).not.toContain('<script>alert(1)');
    expect(html).toContain('&quot;&gt;&lt;script&gt;');
    expect(html).not.toContain('</script><script>x()');
  });
});

describe('helpers', () => {
  it('summarize cuts long text at a word boundary', () => {
    expect(summarize('one two three four', 10)).toBe('one two…');
  });

  it('absoluteUrl resolves relative paths and rejects non-http URLs', () => {
    expect(absoluteUrl('/uploads/a.png', 'https://ada.dev')).toBe('https://ada.dev/uploads/a.png');
    expect(absoluteUrl('https://cdn.x/a.png', 'https://ada.dev')).toBe('https://cdn.x/a.png');
    expect(absoluteUrl('javascript:alert(1)', 'https://ada.dev')).toBeNull();
    expect(absoluteUrl('  ', 'https://ada.dev')).toBeNull();
  });
});

describe('siteUrl', () => {
  const req = (headers: Record<string, string>) =>
    ({ protocol: 'http', get: (h: string) => headers[h.toLowerCase()] }) as any;

  afterEach(() => {
    delete process.env.SITE_URL;
  });

  it('prefers SITE_URL, trimming trailing slashes', () => {
    process.env.SITE_URL = 'https://ada.dev//';
    expect(siteUrl(req({ host: 'api:3000' }))).toBe('https://ada.dev');
  });

  it('otherwise uses the forwarded host and protocol', () => {
    expect(siteUrl(req({ host: 'api:3000', 'x-forwarded-host': 'ada.dev', 'x-forwarded-proto': 'https' }))).toBe('https://ada.dev');
    expect(siteUrl(req({ host: 'localhost:3000' }))).toBe('http://localhost:3000');
  });
});

describe('blog post share pages', () => {
  it('stays put for crawlers when forward is false, with the publish date', () => {
    const url = 'https://ada.dev/blog/hello';
    const html = renderSharePage({ title: 'Hello', shareUrl: url, targetUrl: url, publishedTime: '2026-11-12T00:00:00.000Z', forward: false });
    expect(html).toContain('<meta property="article:published_time" content="2026-11-12T00:00:00.000Z" />');
    expect(html).toContain(`<link rel="canonical" href="${url}" />`);
    expect(html).not.toContain('http-equiv="refresh"');
    expect(html).not.toContain('location.replace');
    expect(html).not.toContain('noindex');
  });

  it('turns a Markdown body into plain preview text', () => {
    const md = '## Intro\n\nI used **NestJS** and [Postgres](https://pg.dev).\n\n```ts\nsecret()\n```\n\n- one\n- two\n\n![shot](a.png) <b>done</b>';
    expect(markdownToText(md)).toBe('Intro I used NestJS and Postgres. one two done');
  });
});
