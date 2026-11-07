import type { IsURLOptions } from 'validator';

/**
 * URL rules for owner-entered links. Hosts without a TLD (e.g. localhost) are allowed so
 * that files uploaded to a local dev API, which get http://localhost:3000/... URLs, validate.
 */
export const URL_OPTIONS: IsURLOptions = { require_protocol: true, require_tld: false };
