import { proxyToApi } from '../cloudflare/api-proxy.js';

// RSS feed of blog posts, built by the API.
export const onRequestGet = (context) => proxyToApi(context, '/share/rss.xml');
