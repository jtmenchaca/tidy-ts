/**
 * Sort benchmark: WASM vs Native+Rayon — same 5 tests as the main benchmark.
 * Compares against Polars (run bench-sort-comparison.py for Polars numbers).
 *
 * Run with: deno run -A packages/testing/benchmarks/bench-arrange-rayon.ts
 */
import { createDataFrame } from "@tidy-ts/dataframe";
import { usingNativeBackend } from "../../dataframe/ts/wasm/wasm-init.ts";

const WARMUP = 3;
const ITERATIONS = 5;
const N = 500_000;

function measure(fn: () => void): number {
  for (let i = 0; i < WARMUP; i++) fn();
  const times: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const t = performance.now();
    fn();
    times.push(performance.now() - t);
  }
  times.sort((a, b) => a - b);
  return times[Math.floor(times.length / 2)];
}

const backend = usingNativeBackend() ? "NATIVE (rayon)" : "WASM";
console.log(`\nSort benchmark — ${N.toLocaleString()} rows`);
console.log(`Backend: ${backend}\n`);

const numericData = Array.from({ length: N }, (_, i) => ({
  value: Math.random() * 1000,
  date: new Date(
    2020 + Math.floor(Math.random() * 4),
    Math.floor(Math.random() * 12),
    Math.floor(Math.random() * 28),
  ),
  score: i % 10 === 0 ? null : Math.random() * 100,
}));

const mixedData = Array.from({ length: N }, (_, i) => ({
  name: `name_${i % 100}`,
  category: `category_${i % 20}`,
  value: Math.random() * 1000,
  active: i % 3 === 0,
}));

const groupedData = Array.from({ length: N }, (_, i) => ({
  group: `group_${i % 5}`,
  value: Math.random() * 1000,
  priority: Math.floor(Math.random() * 10),
}));

console.log("Building DataFrames...");
const numericDf = createDataFrame(numericData);
const mixedDf = createDataFrame(mixedData);
const groupedDf = createDataFrame(groupedData);
console.log("DataFrames built.\n");

const t1 = measure(() => numericDf.arrange("value", "asc"));
console.log(`  1. Numeric single col:     ${t1.toFixed(2)}ms`);

const t2 = measure(() =>
  numericDf.arrange(["value", "score"], ["asc", "desc"])
);
console.log(`  2. Numeric multi col:      ${t2.toFixed(2)}ms`);

const t3 = measure(() => mixedDf.arrange("name", "asc"));
console.log(`  3. String single col:      ${t3.toFixed(2)}ms`);

const t4 = measure(() =>
  mixedDf.arrange(["category", "value"], ["asc", "desc"])
);
console.log(`  4. Mixed types multi col:  ${t4.toFixed(2)}ms`);

const t5 = measure(() =>
  groupedDf.groupBy("group").arrange("value", "desc")
);
console.log(`  5. Grouped sort:           ${t5.toFixed(2)}ms`);

const weighted = (t1 * 2 + t2 * 2 + t3 + t4 + t5) / 7;
console.log(`\n  Weighted average:          ${weighted.toFixed(2)}ms`);

console.log(`\n  --- Comparison (pre-built DataFrames) ---`);
console.log(`  Polars:                     18.00ms`);
console.log(`  tidy-ts (${backend}):  ${weighted.toFixed(2)}ms`);
console.log(`  Ratio:                      ${(weighted / 18).toFixed(1)}x slower`);
