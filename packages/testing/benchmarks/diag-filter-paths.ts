import { createDataFrame } from "@tidy-ts/dataframe";
// Access internals for benchmarking
const internals = await import("../../dataframe/ts/wasm/sorting-functions.ts");
const viewInternals = await import("../../dataframe/ts/dataframe/implementation/columnar-view.ts");

const N = 100_000;
const ITERS = 50;
function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

// Create test data
const values = new Float64Array(N);
for (let i = 0; i < N; i++) values[i] = Math.random() * 100;

// Warmup
for (let w = 0; w < 10; w++) {
  internals.batch_filter_bitset(values, 50, 0);
  internals.mutate_compare_scalar_raw(values, 50, 0);
}

// 1. batch_filter_bitset (current path)
const t1: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  const bs = internals.batch_filter_bitset(values, 50, 0);
  t1.push(performance.now() - t);
}
console.log(`batch_filter_bitset:                    ${median(t1).toFixed(3)}ms`);

// 2. mutate_compare_scalar_raw only (Uint8Array)
const t2: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  const mask = internals.mutate_compare_scalar_raw(values, 50, 0);
  t2.push(performance.now() - t);
}
console.log(`mutate_compare_scalar_raw:              ${median(t2).toFixed(3)}ms`);

// 3. mutate_compare_scalar_raw + bitsetFromMask
const t3: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  const mask = internals.mutate_compare_scalar_raw(values, 50, 0);
  const bs = viewInternals.bitsetFromMask(mask!);
  t3.push(performance.now() - t);
}
console.log(`mutate_compare_scalar_raw+bitsetFromMask: ${median(t3).toFixed(3)}ms`);

// 4. Full filter call
const rows = Array.from({ length: N }, (_, i) => ({ x: values[i], y: Math.random() * 50 }));
const df = createDataFrame(rows);
for (let w = 0; w < 10; w++) df.filter((r: any) => r.x > 50);

const t4: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  df.filter((r: any) => r.x > 50);
  t4.push(performance.now() - t);
}
console.log(`full filter (r.x > 50):                 ${median(t4).toFixed(3)}ms`);

// 5. Just withMask overhead
const mask = internals.mutate_compare_scalar_raw(values, 50, 0);
const bs = viewInternals.bitsetFromMask(mask!);
for (let w = 0; w < 10; w++) {
  const { withMask } = await import("../../dataframe/ts/dataframe/implementation/row-cursor.ts");
  withMask(df, bs);
}
const t5: number[] = [];
const { withMask } = await import("../../dataframe/ts/dataframe/implementation/row-cursor.ts");
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  withMask(df, bs);
  t5.push(performance.now() - t);
}
console.log(`withMask only:                          ${median(t5).toFixed(3)}ms`);

console.log(`\nPolars filter→mutate:                   0.068ms`);
