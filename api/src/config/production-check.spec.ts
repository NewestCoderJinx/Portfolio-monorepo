import { describe, expect, it } from 'vitest';
import { corsOrigins, productionConfigProblems, trustProxySetting } from './production-check';

const strong = { JWT_SECRET: 'x'.repeat(48), POSTGRES_PASSWORD: 'a-long-db-password' };

describe('productionConfigProblems', () => {
  it('ignores development', () => {
    expect(productionConfigProblems({ NODE_ENV: 'development' })).toEqual([]);
    expect(productionConfigProblems({})).toEqual([]);
  });

  it('accepts strong secrets in production', () => {
    expect(productionConfigProblems({ NODE_ENV: 'production', ...strong })).toEqual([]);
  });

  it('rejects missing, default and short secrets in production', () => {
    expect(productionConfigProblems({ NODE_ENV: 'production' })).toEqual(['JWT_SECRET is not set.', 'POSTGRES_PASSWORD is not set.']);
    expect(
      productionConfigProblems({ NODE_ENV: 'production', JWT_SECRET: 'super_secret_jwt_key', POSTGRES_PASSWORD: 'secret_password' }),
    ).toEqual(['JWT_SECRET is still a default value.', 'POSTGRES_PASSWORD is still a default value.']);
    expect(productionConfigProblems({ NODE_ENV: 'production', JWT_SECRET: 'short', POSTGRES_PASSWORD: 'short' })).toEqual([
      'JWT_SECRET must be at least 32 characters.',
      'POSTGRES_PASSWORD must be at least 12 characters.',
    ]);
  });
});

describe('trustProxySetting', () => {
  it('is off unless set', () => {
    expect(trustProxySetting(undefined)).toBe(false);
    expect(trustProxySetting(' ')).toBe(false);
    expect(trustProxySetting('false')).toBe(false);
  });

  it('reads hop counts, true and address lists', () => {
    expect(trustProxySetting('1')).toBe(1);
    expect(trustProxySetting('true')).toBe(true);
    expect(trustProxySetting('loopback, 172.16.0.0/12')).toBe('loopback, 172.16.0.0/12');
  });
});

describe('corsOrigins', () => {
  it('allows any origin in development and none in production by default', () => {
    expect(corsOrigins({})).toBe(true);
    expect(corsOrigins({ NODE_ENV: 'production' })).toBe(false);
  });

  it('uses the configured list', () => {
    expect(corsOrigins({ NODE_ENV: 'production', CORS_ORIGINS: 'https://ada.dev/, https://www.ada.dev' })).toEqual([
      'https://ada.dev',
      'https://www.ada.dev',
    ]);
  });
});
