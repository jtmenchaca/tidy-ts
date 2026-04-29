#!/usr/bin/env -S deno run -A
/**
 * Diagnostic: filter→mutate phase-level profiling with averaged timings.
 * Captures console.log output from __TIDY_PROFILE, parses phase timings,
 * and reports mean/median across many iterations.
 */

import { createDataFrame } from "@tidy-ts/dataframe";

const N = 100_000;
const WARMUP = 20;
const ITERS = 100;

const rows = Array.from({ length: N }, (_, i) => ({
  x: Math.random() * 100,
  y: Math.random() * 50,
  name: ["alpha", "beta", "gamma", "delta"][i % 4],
  flag: i % 2 === 0,
}));
const df = createDataFrame(rows);

// Intercept console.log to capture phase timings
const phaseTimings: Record<string, number[]> = {};
const originalLog = console.log;

function captureLog(...args: unknown[]) {
  const msg = args.join(" ");
  const match = msg.match(/\[([^\]]+)\]\s+(.+?):\s+(\d+\.\d+)ms/);
  if (match) {
    const key = `[${match[1]}] ${match[2]}`;
    const ms = parseFloat(match[3]);
    if (!phaseTimings[key]) phaseTimings[key] = [];
    phaseTimings[key].push(ms);
  }
}

const wallTimes: number[] = [];

// Warmup (profiling off)
for (let i = 0; i < WARMUP; i++) {
  df.filter((r) => r.x > 50).mutate({ z: (r) => r.x + r.y });
}

// Measure (profiling on)
(globalThis as Record<string, unknown>).__TIDY_PROFILE = true;
console.log = captureLog;
for (let i = 0; i < ITERS; i++) {
  const t0 = performance.now();
  df.filter((r) => r.x > 50).mutate({ z: (r) => r.x + r.y });
  wallTimes.push(performance.now() - t0);
}
console.log = originalLog;
(globalThis as Record<string, unknown>).__TIDY_PROFILE = false;

// Stats helpers
function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
function mean(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}
function p95(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.95)];
}

// Report
console.log(`\n=== filter→mutate phase profiling (${N.toLocaleString()} rows, ${ITERS} iters) ===\n`);

const pad = (s: string, n: number) => s.padEnd(n);
const rpad = (s: string, n: number) => s.padStart(n);

console.log(`${pad("Phase", 60)} ${rpad("median", 10)} ${rpad("mean", 10)} ${rpad("p95", 10)} ${rpad("n", 5)}`);
console.log("-".repeat(95));

// Sort by median descending
const entries = Object.entries(phaseTimings).sort((a, b) => median(b[1]) - median(a[1]));

for (const [key, times] of entries) {
  console.log(
    `${pad(key, 60)} ${rpad(median(times).toFixed(4) + "ms", 10)} ${rpad(mean(times).toFixed(4) + "ms", 10)} ${rpad(p95(times).toFixed(4) + "ms", 10)} ${rpad(String(times.length), 5)}`,
  );
}

console.log("-".repeat(95));
console.log(
  `${pad("WALL TIME (filter + mutate)", 60)} ${rpad(median(wallTimes).toFixed(4) + "ms", 10)} ${rpad(mean(wallTimes).toFixed(4) + "ms", 10)} ${rpad(p95(wallTimes).toFixed(4) + "ms", 10)} ${rpad(String(wallTimes.length), 5)}`,
);

console.log("\nDone.");
