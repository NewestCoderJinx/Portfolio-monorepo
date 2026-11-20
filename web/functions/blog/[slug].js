import { PREVIEW_CRAWLER, proxyToApi } from '../../cloudflare/api-proxy.js';

// Blog posts (/blog/<slug>): preview crawlers get a page with the post's preview tags from the API;
// everyone else gets the app (context.next() serves index.html, as for any other page route).
export const onRequestGet = (context) => {
  if (PREVIEW_CRAWLER.test(context.request.headers.get('User-Agent') || '')) {
    return proxyToApi(context, `/share/posts/${encodeURIComponent(context.params.slug)}`);
  }
  return context.next();
};
