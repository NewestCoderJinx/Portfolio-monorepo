import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const escapeAttr = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Link-preview crawlers (LinkedIn, WhatsApp, Slack, X) don't run JavaScript,
 * so title/description/image must be in the static index.html at build time.
 */
function seoMeta(env: Record<string, string>): Plugin {
  const title = env.VITE_SITE_TITLE || 'Developer Portfolio';
  const description =
    env.VITE_SITE_DESCRIPTION || 'Software projects with the problems, decisions and lessons behind them.';
  const siteUrl = (env.VITE_SITE_URL || '').replace(/\/+$/, '');
  const rawImage = env.VITE_OG_IMAGE || '';
  // og:image must be absolute; allow a path relative to the site URL.
  const image = rawImage && !/^https?:\/\//.test(rawImage) && siteUrl ? `${siteUrl}/${rawImage.replace(/^\/+/, '')}` : rawImage;

  const tags = [
    `<title>${escapeAttr(title)}</title>`,
    `<meta name="description" content="${escapeAttr(description)}" />`,
    `<meta name="theme-color" content="#2b6cb0" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeAttr(title)}" />`,
    `<meta property="og:description" content="${escapeAttr(description)}" />`,
    siteUrl && `<meta property="og:url" content="${escapeAttr(siteUrl)}/" />`,
    siteUrl && `<link rel="canonical" href="${escapeAttr(siteUrl)}/" />`,
    image && `<meta property="og:image" content="${escapeAttr(image)}" />`,
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${escapeAttr(title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(description)}" />`,
    image && `<meta name="twitter:image" content="${escapeAttr(image)}" />`,
  ].filter(Boolean);

  return {
    name: 'seo-meta',
    transformIndexHtml: (html) => html.replace(/<title>.*?<\/title>/, tags.join('\n    ')),
  };
}

/** Public pages for the sitemap. Case studies are #fragments of "/", so they aren't separate URLs. */
const PUBLIC_PATHS = ['/', '/resume'];

/**
 * Emits robots.txt and, when VITE_SITE_URL is set, sitemap.xml (which needs absolute URLs).
 * Generated rather than kept in public/ so robots.txt can point to the sitemap.
 */
function crawlerFiles(env: Record<string, string>): Plugin {
  const siteUrl = (env.VITE_SITE_URL || '').replace(/\/+$/, '');
  return {
    name: 'crawler-files',
    apply: 'build',
    generateBundle() {
      const robots = ['User-agent: *', 'Allow: /', 'Disallow: /admin'];
      if (siteUrl) robots.push('', `Sitemap: ${siteUrl}/sitemap.xml`);
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `${robots.join('\n')}\n` });

      if (!siteUrl) return;
      const lastmod = new Date().toISOString().slice(0, 10);
      const urls = PUBLIC_PATHS.map(
        (path) => `  <url>\n    <loc>${escapeAttr(siteUrl + path)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`,
      );
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react(), seoMeta(env), crawlerFiles(env)],
    server: {
      // Mirrors nginx in production, so share links work in development too.
      proxy: {
        '/p/': {
          target: env.VITE_API_URL || 'http://localhost:3000',
          rewrite: (path: string) => path.replace(/^\/p\//, '/share/projects/'),
        },
      },
    },
  };
});
