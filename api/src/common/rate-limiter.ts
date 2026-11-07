/**
 * In-memory sliding-window limiter: at most `limit` hits per key within `windowMs`.
 * Good enough for a single API instance; state resets when the process restarts.
 */
export class RateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  /** Records a hit and returns true if it is within the limit. */
  tryHit(key: string): boolean {
    const now = this.now();
    if (this.hits.size > 10_000) this.sweep(now);
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }

  private sweep(now: number) {
    for (const [key, times] of this.hits) {
      if (times.every((t) => now - t >= this.windowMs)) this.hits.delete(key);
    }
  }
}
