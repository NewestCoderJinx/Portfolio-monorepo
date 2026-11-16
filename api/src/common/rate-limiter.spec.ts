import { describe, expect, it } from 'vitest';
import { RateLimiter } from './rate-limiter';

describe('RateLimiter', () => {
  it('allows up to the limit per key, then blocks until the window passes', () => {
    let now = 0;
    const limiter = new RateLimiter(2, 1000, () => now);
    expect(limiter.tryHit('a')).toBe(true);
    expect(limiter.tryHit('a')).toBe(true);
    expect(limiter.tryHit('a')).toBe(false);
    expect(limiter.tryHit('b')).toBe(true);
    now = 1000;
    expect(limiter.tryHit('a')).toBe(true);
  });

  it('isLimited peeks without recording, and reset clears a key', () => {
    let now = 0;
    const limiter = new RateLimiter(1, 1000, () => now);
    expect(limiter.isLimited('a')).toBe(false);
    expect(limiter.isLimited('a')).toBe(false);
    limiter.tryHit('a');
    expect(limiter.isLimited('a')).toBe(true);
    limiter.reset('a');
    expect(limiter.isLimited('a')).toBe(false);
  });
});
