/**
 * Shared by the Cloudflare Pages Functions in ../functions. They do what nginx.conf does in the Docker
 * setup: send share links, the RSS feed and link-preview crawlers to the API, which builds those pages.
 * The API's address comes from VITE_API_URL, the same Pages setting the site's build uses.
 */

// Link-preview crawlers that don't run JavaScript; keep in sync with the map in nginx.conf. Search
// engines are left out on purpose: they render the app and should index the real page.
export const PREVIEW_CRAWLER =
  /facebookexternalhit|facebookcatalog|twitterbot|linkedinbot|slackbot|slack-imgproxy|discordbot|telegrambot|whatsapp|skypeuripreview|pinterest|redditbot|embedly|vkshare|iframely|mastodon|bluesky|cardyb/i;

/** Fetches `apiPath` from the API on behalf of the visitor and passes the response straight back. */
export async function proxyToApi(context, apiPath) {
  const apiUrl = (context.env.VITE_API_URL || '').replace(/\/+$/, '');
  if (!/^https?:\/\//.test(apiUrl)) {
    return new Response('VITE_API_URL is not set to the API address in the Pages project settings.', { status: 502 });
  }

  const site = new URL(context.request.url);
  const headers = new Headers({
    Accept: context.request.headers.get('Accept') || '*/*',
    'User-Agent': context.request.headers.get('User-Agent') || '',
    // Lets the API build links to this site when SITE_URL isn't set on it.
    'X-Forwarded-Host': site.host,
    'X-Forwarded-Proto': site.protocol.replace(':', ''),
  });

  try {
    return await fetch(`${apiUrl}${apiPath}`, { headers, redirect: 'manual' });
  } catch {
    return new Response('The portfolio API could not be reached. Please try again in a minute.', { status: 502 });
  }
}
