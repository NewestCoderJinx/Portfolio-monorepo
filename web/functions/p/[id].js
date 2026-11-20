import { proxyToApi } from '../../cloudflare/api-proxy.js';

// Share links (/p/<project id>): a page with that project's link-preview tags, which forwards to the case study.
export const onRequestGet = (context) => proxyToApi(context, `/share/projects/${encodeURIComponent(context.params.id)}`);
