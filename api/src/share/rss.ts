import { markdownToText, summarize } from './share-page';

export interface FeedPost {
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  tags: string[] | null;
  publishedAt: Date | null;
  updatedAt: Date;
}

export interface FeedInfo {
  /** The site's public address, without a trailing slash. */
  site: string;
  title: string;
  description: string;
  posts: FeedPost[];
}

/** How many of the newest posts the feed lists. */
export const FEED_LIMIT = 20;

const escapeXml = (v: string) =>
  v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // Control characters (other than tab and newlines) aren't allowed anywhere in XML 1.0.
    // eslint-disable-next-line no-control-regex -- stripping these is the point
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');

/** An RSS 2.0 feed of published posts, newest first. Readers link each item to /blog/<slug>. */
export function renderRssFeed({ site, title, description, posts }: FeedInfo): string {
  const items = posts.slice(0, FEED_LIMIT).map((post) => {
    const url = `${site}/blog/${encodeURIComponent(post.slug)}`;
    const summary = post.excerpt || summarize(markdownToText(post.body), 400);
    const date = post.publishedAt ?? post.updatedAt;
    return [
      '    <item>',
      `      <title>${escapeXml(post.title)}</title>`,
      `      <link>${escapeXml(url)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
      `      <pubDate>${date.toUTCString()}</pubDate>`,
      summary && `      <description>${escapeXml(summary)}</description>`,
      ...(post.tags ?? []).map((tag) => `      <category>${escapeXml(tag)}</category>`),
      '    </item>',
    ]
      .filter(Boolean)
      .join('\n');
  });
  const newest = posts[0]?.publishedAt ?? posts[0]?.updatedAt;

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(title)}</title>`,
    `    <link>${escapeXml(`${site}/blog`)}</link>`,
    `    <description>${escapeXml(description)}</description>`,
    `    <atom:link href="${escapeXml(`${site}/rss.xml`)}" rel="self" type="application/rss+xml" />`,
    newest && `    <lastBuildDate>${newest.toUTCString()}</lastBuildDate>`,
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ]
    .filter((line) => typeof line === 'string')
    .join('\n');
}
