/** What a shared link should look like in a preview card. */
export interface SharePreview {
  title: string;
  description?: string | null;
  /** Absolute image URL, or null for a text-only card. */
  image?: string | null;
  /** This share link itself (og:url). */
  shareUrl: string;
  /** Where people are sent: the case study on the portfolio. */
  targetUrl: string;
  siteName?: string | null;
}

const escapeHtml = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Collapses whitespace and cuts at a word boundary, for preview descriptions. */
export function summarize(text: string, max = 200): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

/** Resolves a possibly relative URL against the site; returns null for anything that isn't http(s). */
export function absoluteUrl(url: string | null | undefined, base: string): string | null {
  if (!url?.trim()) return null;
  try {
    const resolved = new URL(url.trim(), `${base}/`);
    return /^https?:$/.test(resolved.protocol) ? resolved.href : null;
  } catch {
    return null;
  }
}

/**
 * A tiny page whose <head> carries the preview tags for crawlers that don't run JavaScript
 * (LinkedIn, WhatsApp, Slack, X), and which forwards people straight on to the case study.
 */
export function renderSharePage(p: SharePreview): string {
  const title = escapeHtml(p.title);
  const description = p.description ? escapeHtml(summarize(p.description)) : '';
  const target = escapeHtml(p.targetUrl);
  const tags = [
    `<title>${title}</title>`,
    description && `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${target}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:title" content="${title}" />`,
    description && `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${escapeHtml(p.shareUrl)}" />`,
    p.siteName && `<meta property="og:site_name" content="${escapeHtml(p.siteName)}" />`,
    p.image && `<meta property="og:image" content="${escapeHtml(p.image)}" />`,
    `<meta name="twitter:card" content="${p.image ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    description && `<meta name="twitter:description" content="${description}" />`,
    p.image && `<meta name="twitter:image" content="${escapeHtml(p.image)}" />`,
    `<meta http-equiv="refresh" content="0; url=${target}" />`,
  ].filter(Boolean);

  // JSON.stringify gives a valid JS string; "<" is escaped so the value can't close the script tag.
  const jsTarget = JSON.stringify(p.targetUrl).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    ${tags.join('\n    ')}
    <script>window.location.replace(${jsTarget});</script>
  </head>
  <body>
    <p><a href="${target}">${title}</a></p>
  </body>
</html>
`;
}
