#!/usr/bin/env -S deno run -A
/**
 * Profile mutate call overhead with per-phase instrumentation.
 * Reports median of multiple iterations alongside Polars reference numbers.
 *
 * Usage:
 *   deno run -A --no-check packages/testing/benchmarks/bench-profile-mutate.ts
 *   deno run -A --no-check packages/testing/benchmarks/bench-profile-mutate.ts --detail
 *
 * --detail: show per-phase breakdown for each test (enables __TIDY_PROFILE)
 */

const DETAIL = Deno.args.includes("--detail");
if (DETAIL) {
  (globalThis as any).__TIDY_PROFILE = true;
}

import { createDataFrame } from "@tidy-ts/dataframe";

const N = 100_000;
const ITERS = 50;
const WARMUP = 10;

// Polars reference medians (100K rows, 50 iters, same machine)
// Re-run bench-polars-mutate.py to update these
const POLARS: Record<string, number> = {
  "1": 0.064,
  "2": 0.061,
  "3": 0.062,
  "4": 0.030,
  "5": 0.030,
  "6": 0.030,
  "7": 0.091,
  "8": 0.031,
  "9": 0.012,
  "10": 0.011,
  "11": 1.641,
  "12": 2.342,
  "13": 0.041,
  "14": 0.062,
  "15": 0.822,
  "16": 2.509,
  "17": 0.068,
  "18": 0.302,
};

const rows = Array.from({ length: N }, (_, i) => ({
  x: Math.random() * 100,
  y: Math.random() * 50,
  name: ["alpha", "beta", "gamma", "delta"][i % 4],
  flag: i % 2 === 0,
}));
const df = createDataFrame(rows);
const arr = Array.from({ length: N }, (_, i) => i * 2);

interface TestCase {
  id: string;
  label: string;
  fn: () => unknown;
}

const tests: TestCase[] = [
  { id: "1", label: "col+col (x+y)", fn: () => df.mutate({ z: (r) => r.x + r.y }) },
  { id: "2", label: "col*col (x*y)", fn: () => df.mutate({ z: (r) => r.x * r.y }) },
  { id: "3", label: "col-col (x-y)", fn: () => df.mutate({ z: (r) => r.x - r.y }) },
  { id: "4", label: "col/scalar (x/2)", fn: () => df.mutate({ z: (r) => r.x / 2 }) },
  { id: "5", label: "col+scalar (x+1)", fn: () => df.mutate({ z: (r) => r.x + 1 }) },
  { id: "6", label: "col*scalar (x*100)", fn: () => df.mutate({ z: (r) => r.x * 100 }) },
  { id: "7", label: "multi (x+y, x*y)", fn: () => df.mutate({ z: (r) => r.x + r.y, w: (r) => r.x * r.y }) },
  { id: "8", label: "boolean (x>50)", fn: () => df.mutate({ big: (r) => r.x > 50 }) },
  { id: "9", label: "scalar (42)", fn: () => df.mutate({ constant: 42 }) },
  { id: "10", label: "array assign", fn: () => df.mutate({ arr }) },
  { id: "11", label: "string upper", fn: () => df.mutate({ upper: (r) => r.name.toUpperCase() }) },
  { id: "12", label: "mixed (num+str+scalar)", fn: () => df.mutate({ z: (r) => r.x + 1, label: (r) => r.name + "!", c: 0 }) },
  { id: "13", label: "drop column (null)", fn: () => df.mutate({ name: null }) },
  { id: "14", label: "chained mutate", fn: () => df.mutate({ z: (r) => r.x + 1 }).mutate({ w: (r) => r.z * 2 }) },
  { id: "15", label: "grouped numeric", fn: () => df.groupBy("name").mutate({ z: (r) => r.x + r.y }) },
  { id: "16", label: "grouped string", fn: () => df.groupBy("name").mutate({ upper: (r) => r.name.toUpperCase() }) },
  { id: "17", label: "filter→mutate", fn: () => df.filter((r) => r.x > 50).mutate({ z: (r) => r.x + r.y }) },
  { id: "18", label: "ternary", fn: () => df.mutate({ cat: (r) => r.x > 50 ? "high" : "low" }) },
];

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

console.log(`\n=== Mutate Profiling Benchmark (${N.toLocaleString()} rows, ${ITERS} iters) ===\n`);

if (DETAIL) {
  // Single-shot detail mode with per-phase breakdown
  // Warmup
  console.log("--- Warmup ---");
  df.mutate({ z: (r) => r.x + r.y });
  console.log("");

  for (const test of tests) {
    console.log(`--- ${test.id}. ${test.label} ---`);
    const t = performance.now();
    test.fn();
    const elapsed = performance.now() - t;
    const pl = POLARS[test.id];
    const ratio = elapsed / pl;
    console.log(`  TOTAL: ${elapsed.toFixed(3)}ms  |  Polars: ${pl.toFixed(3)}ms  |  ${ratio.toFixed(1)}x\n`);
  }
} else {
  // Multi-iteration mode: median timing + Polars comparison table
  const results: { id: string; label: string; tidy: number; polars: number }[] = [];

  for (const test of tests) {
    // warmup
    for (let i = 0; i < WARMUP; i++) test.fn();
    // measure
    const times: number[] = [];
    for (let i = 0; i < ITERS; i++) {
      const t = performance.now();
      test.fn();
      times.push(performance.now() - t);
    }
    const med = median(times);
    const pl = POLARS[test.id];
    results.push({ id: test.id, label: test.label, tidy: med, polars: pl });
  }

  // Print table
  const pad = (s: string, n: number) => s.padEnd(n);
  const rpad = (s: string, n: number) => s.padStart(n);

  console.log(
    `${pad("# ", 3)} ${pad("Operation", 26)} ${rpad("tidy-ts", 9)} ${rpad("Polars", 9)} ${rpad("Ratio", 7)}`,
  );
  console.log("-".repeat(58));

  for (const r of results) {
    const ratio = r.tidy / r.polars;
    const ratioStr = ratio < 1.5 ? `${ratio.toFixed(1)}x` : ratio < 5 ? `${ratio.toFixed(1)}x ⚠` : `${ratio.toFixed(1)}x ✗`;
    console.log(
      `${pad(r.id + ".", 3)} ${pad(r.label, 26)} ${rpad(r.tidy.toFixed(3) + "ms", 9)} ${rpad(r.polars.toFixed(3) + "ms", 9)} ${rpad(ratioStr, 7)}`,
    );
  }

  console.log("-".repeat(58));
  const totalTidy = results.reduce((s, r) => s + r.tidy, 0);
  const totalPolars = results.reduce((s, r) => s + r.polars, 0);
  console.log(
    `${pad("", 3)} ${pad("TOTAL", 26)} ${rpad(totalTidy.toFixed(3) + "ms", 9)} ${rpad(totalPolars.toFixed(3) + "ms", 9)} ${rpad((totalTidy / totalPolars).toFixed(1) + "x", 7)}`,
  );
}

console.log("\nDone.");
