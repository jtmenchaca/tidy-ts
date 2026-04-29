import { createDataFrame } from "@tidy-ts/dataframe";
import { materializeIndex } from "../../dataframe/ts/dataframe/implementation/columnar-view.ts";

const N = 100_000;
const ITERS = 100;
function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

// Create a rawMask
const rawMask = new Uint8Array(N);
for (let i = 0; i < N; i++) rawMask[i] = Math.random() > 0.5 ? 1 : 0;

// Test 1: materializeIndex with rawMask (no cache)
const t1: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const view = { rawMask, _materializedIndex: null as any };
  const t = performance.now();
  materializeIndex(N, view);
  t1.push(performance.now() - t);
}
console.log(`materializeIndex (rawMask, no cache): ${median(t1).toFixed(3)}ms`);

// Test 2: materializeIndex with rawMask (cached)
const cachedView = { rawMask, _materializedIndex: null as any };
materializeIndex(N, cachedView); // prime cache
const t2: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  materializeIndex(N, cachedView);
  t2.push(performance.now() - t);
}
console.log(`materializeIndex (rawMask, cached):    ${median(t2).toFixed(3)}ms`);

// Test 3: Full filter+mutate pipeline measurement
const rows = Array.from({ length: N }, (_, i) => ({
  x: Math.random() * 100,
  y: Math.random() * 50,
}));
const df = createDataFrame(rows);

// Warmup
for (let w = 0; w < 10; w++) {
  const f = df.filter((r: any) => r.x > 50);
  f.nrows(); // force materialize
}

// Time just the nrows() call on a fresh filter (forces materializeIndex)
const t3: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const f = df.filter((r: any) => r.x > 50);
  const t = performance.now();
  f.nrows();
  t3.push(performance.now() - t);
}
console.log(`nrows() on fresh filter:              ${median(t3).toFixed(3)}ms`);
