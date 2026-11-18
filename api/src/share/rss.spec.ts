import { describe, expect, it } from 'vitest';
import { FEED_LIMIT, renderRssFeed, type FeedPost } from './rss';

const post = (overrides: Partial<FeedPost> = {}): FeedPost => ({
  title: 'Hello',
  slug: 'hello',
  excerpt: 'A first post.',
  body: '# Hello\n\nBody text.',
  tags: ['nestjs', 'react'],
  publishedAt: new Date('2026-11-01T10:00:00Z'),
  updatedAt: new Date('2026-11-02T10:00:00Z'),
  ...overrides,
});

const feed = (posts: FeedPost[]) =>
  renderRssFeed({
    site: 'https://ada.dev',
    title: 'Ada | Writing',
    description: 'Posts by Ada.',
    posts,
  });

describe('renderRssFeed', () => {
  it('describes the channel and links each item to its post', () => {
    const xml = feed([post()]);
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<rss version="2.0"/);
    expect(xml).toContain('<title>Ada | Writing</title>');
    expect(xml).toContain('<link>https://ada.dev/blog</link>');
    expect(xml).toContain('<atom:link href="https://ada.dev/rss.xml" rel="self" type="application/rss+xml" />');
    expect(xml).toContain('<lastBuildDate>Sun, 01 Nov 2026 10:00:00 GMT</lastBuildDate>');
    expect(xml).toContain('<link>https://ada.dev/blog/hello</link>');
    expect(xml).toContain('<guid isPermaLink="true">https://ada.dev/blog/hello</guid>');
    expect(xml).toContain('<pubDate>Sun, 01 Nov 2026 10:00:00 GMT</pubDate>');
    expect(xml).toContain('<description>A first post.</description>');
    expect(xml).toContain('<category>nestjs</category>\n      <category>react</category>');
  });

  it('falls back to the body as plain text when there is no excerpt', () => {
    const xml = feed([post({ excerpt: null, tags: null })]);
    expect(xml).toContain('<description>Hello Body text.</description>');
    expect(xml).not.toContain('<category>');
  });

  it('escapes text so it cannot break the XML', () => {
    const xml = feed([post({ title: 'Tom & Jerry <script>', excerpt: 'Say "hi"\u0007' })]);
    expect(xml).toContain('<title>Tom &amp; Jerry &lt;script&gt;</title>');
    expect(xml).toContain('<description>Say &quot;hi&quot;</description>');
  });

  it('lists at most the newest posts and works with none', () => {
    const many = Array.from({ length: FEED_LIMIT + 5 }, (_, i) => post({ slug: `p${i}` }));
    expect(feed(many).match(/<item>/g)).toHaveLength(FEED_LIMIT);
    const empty = feed([]);
    expect(empty).not.toContain('<item>');
    expect(empty).not.toContain('lastBuildDate');
    expect(empty).toContain('</channel>\n</rss>\n');
  });
});
