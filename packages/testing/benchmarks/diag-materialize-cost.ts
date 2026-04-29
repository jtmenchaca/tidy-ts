#!/usr/bin/env -S deno run -A
/**
 * Measure the raw cost of materializeIndex on a rawMask of 100K elements.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const N = 100_000;
const WARMUP = 20;
const ITERS = 200;

const rows = Array.from({ length: N }, (_, i) => ({
  x: Math.random() * 100,
  y: Math.random() * 50,
  name: ["alpha", "beta", "gamma", "delta"][i % 4],
  flag: i % 2 === 0,
}));
const df = createDataFrame(rows);

// Time filter alone (produces rawMask view)
const filterTimes: number[] = [];
for (let i = 0; i < WARMUP; i++) df.filter((r) => r.x > 50);
for (let i = 0; i < ITERS; i++) {
  const t0 = performance.now();
  df.filter((r) => r.x > 50);
  filterTimes.push(performance.now() - t0);
}

// Time mutate alone on unfiltered df
const mutateTimes: number[] = [];
for (let i = 0; i < WARMUP; i++) df.mutate({ z: (r) => r.x + r.y });
for (let i = 0; i < ITERS; i++) {
  const t0 = performance.now();
  df.mutate({ z: (r) => r.x + r.y });
  mutateTimes.push(performance.now() - t0);
}

// Time filter→mutate combined
const combinedTimes: number[] = [];
for (let i = 0; i < WARMUP; i++) df.filter((r) => r.x > 50).mutate({ z: (r) => r.x + r.y });
for (let i = 0; i < ITERS; i++) {
  const t0 = performance.now();
  df.filter((r) => r.x > 50).mutate({ z: (r) => r.x + r.y });
  combinedTimes.push(performance.now() - t0);
}

// Time mutate on pre-filtered df (reuse same filtered df)
const filtered = df.filter((r) => r.x > 50);
const mutateFilteredTimes: number[] = [];
for (let i = 0; i < WARMUP; i++) filtered.mutate({ z: (r) => r.x + r.y });
for (let i = 0; i < ITERS; i++) {
  const t0 = performance.now();
  filtered.mutate({ z: (r) => r.x + r.y });
  mutateFilteredTimes.push(performance.now() - t0);
}

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

console.log(`\n=== Materialize Cost Diagnosis (${N.toLocaleString()} rows, ${ITERS} iters) ===\n`);
console.log(`filter alone:               ${median(filterTimes).toFixed(3)}ms`);
console.log(`mutate alone (unfiltered):   ${median(mutateTimes).toFixed(3)}ms`);
console.log(`filter→mutate (combined):    ${median(combinedTimes).toFixed(3)}ms`);
console.log(`mutate on pre-filtered df:   ${median(mutateFilteredTimes).toFixed(3)}ms`);
console.log(`\nExpected combined ≈ filter + mutate_filtered`);
console.log(`Actual overhead:             ${(median(combinedTimes) - median(filterTimes) - median(mutateFilteredTimes)).toFixed(3)}ms`);
console.log(`\nDone.`);
