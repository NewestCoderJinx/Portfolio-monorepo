import { cloudinaryConfig } from '../common/cloudinary';

/** Values that have shipped as defaults in this repo; never acceptable in production. */
const KNOWN_DEFAULTS = new Set(['secret_password', 'super_secret_jwt_key', 'dev_only_jwt_secret_change_me', 'change_me', 'changeme', 'change_me_to_a_long_random_string']);

const JWT_SECRET_MIN_LENGTH = 32;
const DB_PASSWORD_MIN_LENGTH = 12;

/**
 * Problems that make it unsafe to run with NODE_ENV=production: missing or default secrets.
 * Returns an empty list outside production, or when everything is set.
 */
export function productionConfigProblems(env: NodeJS.ProcessEnv = process.env): string[] {
  if (env.NODE_ENV !== 'production') return [];
  const problems: string[] = [];

  const jwt = env.JWT_SECRET?.trim() ?? '';
  if (!jwt) problems.push('JWT_SECRET is not set.');
  else if (KNOWN_DEFAULTS.has(jwt)) problems.push('JWT_SECRET is still a default value.');
  else if (jwt.length < JWT_SECRET_MIN_LENGTH) problems.push(`JWT_SECRET must be at least ${JWT_SECRET_MIN_LENGTH} characters.`);

  // A DATABASE_URL comes from a hosted database, which generates its own password.
  const db = env.POSTGRES_PASSWORD ?? '';
  if (env.DATABASE_URL?.trim()) {
    /* password is part of the URL */
  } else if (!db) problems.push('POSTGRES_PASSWORD is not set.');
  else if (KNOWN_DEFAULTS.has(db)) problems.push('POSTGRES_PASSWORD is still a default value.');
  else if (db.length < DB_PASSWORD_MIN_LENGTH) problems.push(`POSTGRES_PASSWORD must be at least ${DB_PASSWORD_MIN_LENGTH} characters.`);

  try {
    cloudinaryConfig(env);
  } catch (err) {
    problems.push((err as Error).message);
  }

  return problems;
}

/**
 * Express "trust proxy" from TRUST_PROXY: a hop count ("1" when nginx is the only proxy), "true",
 * or a list of addresses/subnets. Unset means the API is reached directly and X-Forwarded-* is ignored,
 * so clients can't fake their IP.
 */
export function trustProxySetting(value: string | undefined): boolean | number | string {
  const v = value?.trim();
  if (!v || v === 'false') return false;
  if (v === 'true') return true;
  if (/^\d+$/.test(v)) return parseInt(v, 10);
  return v;
}

/**
 * Allowed CORS origins from CORS_ORIGINS (comma-separated). Unset: any origin in development, none in
 * production, where the site calls the API through nginx on the same address and needs no CORS.
 */
export function corsOrigins(env: NodeJS.ProcessEnv = process.env): boolean | string[] {
  const list = (env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  if (list.length) return list;
  return env.NODE_ENV !== 'production';
}
