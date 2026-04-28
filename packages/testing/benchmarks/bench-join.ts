/**
 * Join benchmark: tidy-ts vs Polars baseline.
 * Tests inner, left, and outer joins at various sizes.
 *
 * Run with: deno run -A packages/testing/benchmarks/bench-join.ts
 */
import { createDataFrame } from "@tidy-ts/dataframe";
import { usingNativeBackend } from "../../dataframe/ts/wasm/wasm-init.ts";

const WARMUP = 3;
const ITERATIONS = 5;

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

const backend = usingNativeBackend() ? "NATIVE" : "WASM";

// --- Build data ---
const N_LEFT = 500_000;
const N_RIGHT = 100_000;
const N_KEYS = 50_000; // number of unique keys

console.log(
  `\nJoin benchmark — left=${N_LEFT.toLocaleString()}, right=${N_RIGHT.toLocaleString()}, keys=${N_KEYS.toLocaleString()}`,
);
console.log(`Backend: ${backend}\n`);

// Single numeric key
const leftData = Array.from({ length: N_LEFT }, (_, i) => ({
  id: Math.floor(Math.random() * N_KEYS),
  value_l: Math.random() * 100,
}));
const rightData = Array.from({ length: N_RIGHT }, (_, i) => ({
  id: Math.floor(Math.random() * N_KEYS),
  value_r: Math.random() * 100,
}));

// String key
const leftStrData = Array.from({ length: N_LEFT }, (_, i) => ({
  key: `key_${Math.floor(Math.random() * N_KEYS)}`,
  value_l: Math.random() * 100,
}));
const rightStrData = Array.from({ length: N_RIGHT }, (_, i) => ({
  key: `key_${Math.floor(Math.random() * N_KEYS)}`,
  value_r: Math.random() * 100,
}));

// Multi-key (2 columns)
const leftMultiData = Array.from({ length: N_LEFT }, (_, i) => ({
  id_a: Math.floor(Math.random() * 1000),
  id_b: Math.floor(Math.random() * 50),
  value_l: Math.random() * 100,
}));
const rightMultiData = Array.from({ length: N_RIGHT }, (_, i) => ({
  id_a: Math.floor(Math.random() * 1000),
  id_b: Math.floor(Math.random() * 50),
  value_r: Math.random() * 100,
}));

console.log("Building DataFrames...");
const leftDf = createDataFrame(leftData);
const rightDf = createDataFrame(rightData);
const leftStrDf = createDataFrame(leftStrData);
const rightStrDf = createDataFrame(rightStrData);
const leftMultiDf = createDataFrame(leftMultiData);
const rightMultiDf = createDataFrame(rightMultiData);
console.log("DataFrames built.\n");

// 1. Inner join - numeric key
const t1 = measure(() => leftDf.innerJoin(rightDf, "id"));
console.log(`  1. Inner join (numeric key):    ${t1.toFixed(2)}ms`);

// 2. Left join - numeric key
const t2 = measure(() => leftDf.leftJoin(rightDf, "id"));
console.log(`  2. Left join (numeric key):     ${t2.toFixed(2)}ms`);

// 3. Inner join - string key
const t3 = measure(() => leftStrDf.innerJoin(rightStrDf, "key"));
console.log(`  3. Inner join (string key):     ${t3.toFixed(2)}ms`);

// 4. Left join - string key
const t4 = measure(() => leftStrDf.leftJoin(rightStrDf, "key"));
console.log(`  4. Left join (string key):      ${t4.toFixed(2)}ms`);

// 5. Inner join - multi key
const t5 = measure(() =>
  leftMultiDf.innerJoin(rightMultiDf, ["id_a", "id_b"])
);
console.log(`  5. Inner join (2-col key):      ${t5.toFixed(2)}ms`);

// 6. Left join - multi key
const t6 = measure(() => leftMultiDf.leftJoin(rightMultiDf, ["id_a", "id_b"]));
console.log(`  6. Left join (2-col key):       ${t6.toFixed(2)}ms`);

const avg = (t1 + t2 + t3 + t4 + t5 + t6) / 6;
console.log(`\n  Average:                        ${avg.toFixed(2)}ms`);
