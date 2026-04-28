#!/usr/bin/env -S deno run -A
/**
 * Profile stats call overhead by enabling __TIDY_PROFILE flag.
 * Shows exactly where time goes in sum/mean/stdev calls.
 */

(globalThis as any).__TIDY_PROFILE = true;

import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const N = 100_000;
const rows = Array.from({ length: N }, () => ({
  x: Math.random() * 100,
}));
const df = createDataFrame(rows);

// Warmup (no profiling output for these since flag is already set, but
// it warms up the proxy cache)
console.log("=== Warmup (1 call each, primes column cache) ===");
s.sum(df.x);
s.mean(df.x);
s.stdev(df.x);

console.log("\n=== Profiled calls (cache should be warm) ===");

console.log("\n--- s.sum(df.x) ---");
let t = performance.now();
s.sum(df.x);
console.log(`  TOTAL: ${(performance.now() - t).toFixed(4)}ms`);

console.log("\n--- s.mean(df.x) ---");
t = performance.now();
s.mean(df.x);
console.log(`  TOTAL: ${(performance.now() - t).toFixed(4)}ms`);

console.log("\n--- s.stdev(df.x) ---");
t = performance.now();
s.stdev(df.x);
console.log(`  TOTAL: ${(performance.now() - t).toFixed(4)}ms`);

// Also test with raw Float64Array (no proxy)
console.log("\n--- s.sum(Float64Array) directly ---");
const raw = new Float64Array(N);
for (let i = 0; i < N; i++) raw[i] = Math.random() * 100;
t = performance.now();
s.sum(raw);
console.log(`  TOTAL: ${(performance.now() - t).toFixed(4)}ms`);

console.log("\n--- s.mean(Float64Array) directly ---");
t = performance.now();
s.mean(raw);
console.log(`  TOTAL: ${(performance.now() - t).toFixed(4)}ms`);

console.log("\nDone.");
