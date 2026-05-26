import { ai } from "../../mod.ts";
import { expect } from "@std/expect";
import { FakeTime } from "@std/testing/time";

import { withRateLimit } from "./rate-limit.ts";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

Deno.test("rate-limit — no limiter installed is a pass-through", async () => {
  ai.rateLimit.clear();
  expect(ai.rateLimit.get()).toBeNull();
  let ran = false;
  await withRateLimit(async () => {
    ran = true;
  });
  expect(ran).toBe(true);
});

Deno.test("rate-limit — maxConcurrent caps simultaneous in-flight", async () => {
  ai.rateLimit.set({ maxConcurrent: 2 });
  try {
    let inFlight = 0;
    let peak = 0;

    const task = async () => {
      await withRateLimit(async () => {
        inFlight++;
        peak = Math.max(peak, inFlight);
        await sleep(20);
        inFlight--;
      });
    };

    await Promise.all([task(), task(), task(), task(), task()]);
    expect(peak).toBeLessThanOrEqual(2);
  } finally {
    ai.rateLimit.clear();
  }
});

Deno.test("rate-limit — rpm gate admits N immediately; (N+1)th waits for the 60s window to slide", async () => {
  // FakeTime replaces setTimeout/Date.now with a controllable clock, so
  // the 60s rolling-window wait doesn't burn real time and the test
  // scheduler doesn't see a dangling timer.
  const fakeTime = new FakeTime();
  ai.rateLimit.set({ rpm: 3, maxConcurrent: 100 });
  try {
    let acquired = 0;

    // Fire 4 acquires in flight. The first 3 should resolve on the next
    // microtask; the 4th will install a setTimeout waiting for the window.
    const p1 = withRateLimit(async () => { acquired++; });
    const p2 = withRateLimit(async () => { acquired++; });
    const p3 = withRateLimit(async () => { acquired++; });
    const p4 = withRateLimit(async () => { acquired++; });

    // Drain microtasks so the first 3 settle.
    await fakeTime.tickAsync(0);
    expect(acquired).toBe(3);

    // Advance well short of the 60s window — 4th still pending.
    await fakeTime.tickAsync(1_000);
    expect(acquired).toBe(3);

    // Advance past the 60s window — the 4th's setTimeout fires.
    await fakeTime.tickAsync(60_000);
    await Promise.all([p1, p2, p3, p4]);
    expect(acquired).toBe(4);
  } finally {
    ai.rateLimit.clear();
    fakeTime.restore();
  }
});

Deno.test("rate-limit — custom RateLimitAdapter is honored", async () => {
  let acquireCount = 0;
  let releaseCount = 0;
  ai.rateLimit.set({
    acquire: () => {
      acquireCount++;
      return Promise.resolve(() => {
        releaseCount++;
      });
    },
  });
  try {
    await withRateLimit(async () => {});
    await withRateLimit(async () => {});
    expect(acquireCount).toBe(2);
    expect(releaseCount).toBe(2);
  } finally {
    ai.rateLimit.clear();
  }
});
