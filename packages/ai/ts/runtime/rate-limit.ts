// Process-wide rate limiter for ai.evaluate's LLM calls.
//
// Two dimensions:
//   - maxConcurrent: cap simultaneous in-flight requests (semaphore).
//   - rpm: requests-per-rolling-60s-window (sliding count).
//
// Acquire blocks until both budgets allow the call to proceed. The returned
// release function frees the concurrency slot; the RPM record is left in
// place for 60s so it counts against future acquires.
//
// Scope: per-process. For multi-process (distributed) rate limiting, plug
// a custom adapter via setRateLimit({ acquire }).

export interface RateLimitConfig {
  /** Max simultaneous in-flight LLM requests across the process. */
  maxConcurrent?: number;
  /** Max requests per rolling 60-second window. */
  rpm?: number;
}

export interface RateLimitAdapter {
  /** Block until a slot is available; return a release function. */
  acquire(): Promise<() => void>;
}

interface Waiter {
  resolve: () => void;
}

class SimpleRateLimiter implements RateLimitAdapter {
  private inFlight = 0;
  private waiters: Waiter[] = [];
  /** Timestamps (ms since epoch) of recent acquires, for RPM sliding window. */
  private recentAcquires: number[] = [];
  /** Pending RPM-gate timers, so `disposed` can cancel them. */
  private rpmTimers = new Set<ReturnType<typeof setTimeout>>();
  /** Once disposed, all pending and future acquires resolve immediately. */
  private disposed = false;

  constructor(private cfg: Required<Pick<RateLimitConfig, "maxConcurrent" | "rpm">>) {}

  async acquire(): Promise<() => void> {
    while (!this.disposed) {
      this.evictOldAcquires();
      const overConcurrency = this.cfg.maxConcurrent > 0 &&
        this.inFlight >= this.cfg.maxConcurrent;
      const overRpm = this.cfg.rpm > 0 && this.recentAcquires.length >= this.cfg.rpm;
      if (!overConcurrency && !overRpm) break;

      if (overConcurrency) {
        await new Promise<void>((resolve) => this.waiters.push({ resolve }));
        continue;
      }
      // Over RPM but not concurrency: sleep until the oldest acquire expires.
      const oldest = this.recentAcquires[0];
      const wait = Math.max(0, 60_000 - (Date.now() - oldest));
      await new Promise<void>((resolve) => {
        const id = setTimeout(() => {
          this.rpmTimers.delete(id);
          resolve();
        }, wait + 5);
        this.rpmTimers.add(id);
      });
    }

    this.inFlight++;
    this.recentAcquires.push(Date.now());
    return () => {
      this.inFlight--;
      const next = this.waiters.shift();
      if (next) next.resolve();
    };
  }

  /** Cancel pending RPM timers and unblock all concurrency-waiters. */
  dispose(): void {
    this.disposed = true;
    for (const id of this.rpmTimers) clearTimeout(id);
    this.rpmTimers.clear();
    while (this.waiters.length > 0) {
      const w = this.waiters.shift();
      if (w) w.resolve();
    }
  }

  private evictOldAcquires(): void {
    const cutoff = Date.now() - 60_000;
    while (this.recentAcquires.length > 0 && this.recentAcquires[0] < cutoff) {
      this.recentAcquires.shift();
    }
  }
}

// ── Process-wide singleton ──────────────────────────────────────────────

let _adapter: RateLimitAdapter | null = null;
let _currentConfig: RateLimitConfig | null = null;

/** Install a rate-limit adapter. Pass `{ maxConcurrent?, rpm? }` for the
 *  built-in, or pass an `acquire` function for a custom adapter. */
export function setRateLimit(
  config: RateLimitConfig | RateLimitAdapter,
): void {
  if ("acquire" in config) {
    _adapter = config;
    _currentConfig = null;
    return;
  }
  _currentConfig = config;
  _adapter = new SimpleRateLimiter({
    maxConcurrent: config.maxConcurrent ?? 0,
    rpm: config.rpm ?? 0,
  });
}

/** Read the current rate-limit configuration (built-in adapter only). */
export function getRateLimit(): RateLimitConfig | null {
  return _currentConfig;
}

/** Remove any installed rate limiter, cancelling pending waiters and timers. */
export function clearRateLimit(): void {
  const a = _adapter as unknown as { dispose?: () => void } | null;
  if (a && typeof a.dispose === "function") a.dispose();
  _adapter = null;
  _currentConfig = null;
}

/** Internal: called by the evaluate runner around each LLM call. */
export async function withRateLimit<T>(task: () => Promise<T>): Promise<T> {
  if (_adapter === null) return task();
  const release = await _adapter.acquire();
  try {
    return await task();
  } finally {
    release();
  }
}
