#!/usr/bin/env -S deno run -A
/**
 * Measure napi call overhead by calling sum_napi on various sizes
 * and comparing to a raw JS loop.
 */

import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const WARMUP = 10;
const ITERATIONS = 100;

function bench(name: string, fn: () => void): number {
  for (let i = 0; i < WARMUP; i++) fn();
  const times: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const t = performance.now();
    fn();
    times.push(performance.now() - t);
  }
  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)];
  const min = times[0];
  console.log(`  ${name}: ${median.toFixed(4)}ms median, ${min.toFixed(4)}ms min`);
  return median;
}

// Test: napi call overhead with tiny array (1 element)
const tiny = new Float64Array([42.0]);
const small = new Float64Array(10);
const medium = new Float64Array(1000);
const large = new Float64Array(100_000);
for (let i = 0; i < large.length; i++) large[i] = Math.random() * 100;
for (let i = 0; i < medium.length; i++) medium[i] = Math.random() * 100;
for (let i = 0; i < small.length; i++) small[i] = Math.random() * 100;

console.log("\n=== Raw WASM/napi call overhead (Float64Array → sum) ===");
bench("sum(1 element)", () => s.sum(tiny));
bench("sum(10 elements)", () => s.sum(small));
bench("sum(1K elements)", () => s.sum(medium));
bench("sum(100K elements)", () => s.sum(large));
bench("mean(100K elements)", () => s.mean(large));
bench("stdev(100K elements)", () => s.stdev(large));

// Compare: pure JS sum on same 100K array
console.log("\n=== Pure JS sum for comparison ===");
bench("JS loop sum(100K)", () => {
  let s = 0;
  for (let i = 0; i < large.length; i++) s += large[i];
  return s;
});

// Test: df.x proxy access overhead
const rows = Array.from({ length: 100_000 }, () => ({
  x: Math.random() * 100,
}));
const df = createDataFrame(rows);

console.log("\n=== df.x proxy access + stat call ===");
bench("s.sum(df.x)", () => s.sum(df.x));
bench("s.mean(df.x)", () => s.mean(df.x));

// Cache df.x and reuse
const cachedX = df.x;
console.log("\n=== Cached column + stat call ===");
bench("s.sum(cachedX)", () => s.sum(cachedX));
bench("s.mean(cachedX)", () => s.mean(cachedX));

console.log("\nDone.\n");
