#!/usr/bin/env -S deno run -A
/**
 * Local benchmark: stats operations using local @tidy-ts/dataframe (Deno/WASM path).
 * Mirrors the stats section of bench-npm-tidy.ts for direct comparison.
 *
 * Run: deno run -A packages/testing/benchmarks/bench-local-stats.ts
 *
 * Compare against Polars: python3 packages/testing/benchmarks/bench-npm-polars.py
 */

import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const WARMUP = 3;
const ITERATIONS = 20;

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
  const p95 = times[Math.floor(times.length * 0.95)];
  console.log(
    `  ${name}: ${median.toFixed(3)}ms median, ${min.toFixed(3)}ms min, ${p95.toFixed(3)}ms p95`,
  );
  return median;
}

// --- Data generation ---
const N = 100_000;

const rows = Array.from({ length: N }, (_, i) => ({
  x: Math.random() * 100,
  y: Math.random() * 50,
  group: ["A", "B", "C", "D"][i % 4],
}));
const df = createDataFrame(rows);

// --- Basic stats ---
console.log(`\n=== Basic Stats (${N.toLocaleString()} rows) ===`);
bench("s.sum", () => s.sum(df.x));
bench("s.mean", () => s.mean(df.x));
bench("s.stdev", () => s.stdev(df.x));
bench("s.median", () => s.median(df.x));
bench("s.quantile(0.95)", () => s.quantile(df.x, 0.95));

// --- DataFrame verbs ---
console.log(`\n=== DataFrame Verbs (${N.toLocaleString()} rows) ===`);
bench("filter (x > 50)", () => df.filter((r) => r.x > 50));
bench("mutate (z = x + y)", () => df.mutate({ z: (r) => r.x + r.y }));
bench("arrange (x asc)", () => df.arrange("x", "asc"));
bench("select (x, y)", () => df.select("x", "y"));

// --- GroupBy + Summarize ---
console.log(
  `\n=== GroupBy + Summarize (${N.toLocaleString()} rows, 4 groups) ===`,
);
bench("groupBy + summarize (sum, mean, n)", () =>
  df.groupBy("group").summarize({
    sum_x: (g) => s.sum(g.x),
    mean_y: (g) => s.mean(g.y),
    n: (g) => g.nrows(),
  }),
);

// --- Joins ---
const leftN = 50_000;
const rightN = 10_000;
const leftRows = Array.from({ length: leftN }, () => ({
  key: Math.floor(Math.random() * 5000),
  val_left: Math.random(),
}));
const rightRows = Array.from({ length: rightN }, () => ({
  key: Math.floor(Math.random() * 5000),
  val_right: Math.random(),
}));
const leftDf = createDataFrame(leftRows);
const rightDf = createDataFrame(rightRows);

console.log(
  `\n=== Joins (left=${leftN.toLocaleString()}, right=${rightN.toLocaleString()}) ===`,
);
bench("innerJoin", () => leftDf.innerJoin(rightDf, "key"));
bench("leftJoin", () => leftDf.leftJoin(rightDf, "key"));

console.log("\nDone.\n");
