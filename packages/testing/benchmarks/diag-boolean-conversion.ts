#!/usr/bin/env -S deno run -A
/**
 * Diagnostic: profile the boolean conversion bottleneck in mutate comparisons.
 * Breaks down exactly where time is spent for test 8 (boolean x>50).
 */

import { createDataFrame } from "@tidy-ts/dataframe";

const N = 100_000;
const ITERS = 50;

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

// Setup
const rows = Array.from({ length: N }, (_, i) => ({
  x: Math.random() * 100,
  y: Math.random() * 50,
}));
const df = createDataFrame(rows);
const store = (df as any).__store;
const xCol: Float64Array = store.columns.x;
const yCol: Float64Array = store.columns.y;

// Dynamically import wasm functions
const wasm = await import("../../dataframe/ts/wasm/sorting-functions.ts");

console.log(`\n=== Boolean Conversion Diagnostic (${N.toLocaleString()} rows, ${ITERS} iters) ===\n`);

// 1. Raw napi call: compare_scalar_raw → Uint8Array
{
  const times: number[] = [];
  for (let w = 0; w < 10; w++) wasm.mutate_compare_scalar_raw(xCol, 50, 0);
  for (let i = 0; i < ITERS; i++) {
    const t = performance.now();
    wasm.mutate_compare_scalar_raw(xCol, 50, 0);
    times.push(performance.now() - t);
  }
  console.log(`1. napi compare_scalar_raw → Uint8Array:      ${median(times).toFixed(3)}ms`);
}

// 2. napi call + boolean conversion (current path: mutate_compare_scalar)
{
  const times: number[] = [];
  for (let w = 0; w < 10; w++) wasm.mutate_compare_scalar(xCol, 50, 0);
  for (let i = 0; i < ITERS; i++) {
    const t = performance.now();
    wasm.mutate_compare_scalar(xCol, 50, 0);
    times.push(performance.now() - t);
  }
  console.log(`2. napi compare_scalar → boolean[]:           ${median(times).toFixed(3)}ms`);
}

// 2b. napi Vec<bool> path (napi-rs does the boolean conversion natively in C++)
{
  const times: number[] = [];
  for (let w = 0; w < 10; w++) wasm.mutate_compare_scalar_bool(xCol, 50, 0);
  for (let i = 0; i < ITERS; i++) {
    const t = performance.now();
    wasm.mutate_compare_scalar_bool(xCol, 50, 0);
    times.push(performance.now() - t);
  }
  console.log(`2b. napi Vec<bool> → boolean[] (native):      ${median(times).toFixed(3)}ms`);
}

// 3. Just the boolean[] conversion from a pre-existing Uint8Array
{
  const raw = wasm.mutate_compare_scalar_raw(xCol, 50, 0)!;
  const times: number[] = [];
  for (let w = 0; w < 10; w++) {
    const out = new Array(raw.length);
    for (let j = 0; j < raw.length; j++) out[j] = raw[j] !== 0;
  }
  for (let i = 0; i < ITERS; i++) {
    const t = performance.now();
    const out = new Array(raw.length);
    for (let j = 0; j < raw.length; j++) out[j] = raw[j] !== 0;
    times.push(performance.now() - t);
  }
  console.log(`3. Uint8Array → boolean[] conversion only:    ${median(times).toFixed(3)}ms`);
}

// 4. JS columnar comparison (no napi, direct array access)
{
  const times: number[] = [];
  for (let w = 0; w < 10; w++) {
    const out = new Array(N);
    for (let j = 0; j < N; j++) out[j] = xCol[j] > 50;
  }
  for (let i = 0; i < ITERS; i++) {
    const t = performance.now();
    const out = new Array(N);
    for (let j = 0; j < N; j++) out[j] = xCol[j] > 50;
    times.push(performance.now() - t);
  }
  console.log(`4. JS columnar (xCol[i] > 50 → boolean[]):   ${median(times).toFixed(3)}ms`);
}

// 5. Full end-to-end mutate (test 8: boolean)
{
  const times: number[] = [];
  for (let w = 0; w < 10; w++) df.mutate({ big: (r: any) => r.x > 50 });
  for (let i = 0; i < ITERS; i++) {
    const t = performance.now();
    df.mutate({ big: (r: any) => r.x > 50 });
    times.push(performance.now() - t);
  }
  console.log(`5. Full mutate({ big: r => r.x > 50 }):       ${median(times).toFixed(3)}ms`);
}

// 6. Full end-to-end mutate for a numeric op (reference)
{
  const times: number[] = [];
  for (let w = 0; w < 10; w++) df.mutate({ z: (r: any) => r.x + r.y });
  for (let i = 0; i < ITERS; i++) {
    const t = performance.now();
    df.mutate({ z: (r: any) => r.x + r.y });
    times.push(performance.now() - t);
  }
  console.log(`6. Full mutate({ z: r => r.x + r.y }):        ${median(times).toFixed(3)}ms (numeric ref)`);
}

// 7. Scalar mutate (test 9)
{
  const times: number[] = [];
  for (let w = 0; w < 10; w++) df.mutate({ constant: 42 });
  for (let i = 0; i < ITERS; i++) {
    const t = performance.now();
    df.mutate({ constant: 42 });
    times.push(performance.now() - t);
  }
  console.log(`7. Full mutate({ constant: 42 }):              ${median(times).toFixed(3)}ms`);
}

// 8. Array assign (test 10)
{
  const arr = Array.from({ length: N }, (_, i) => i * 2);
  const times: number[] = [];
  for (let w = 0; w < 10; w++) df.mutate({ arr });
  for (let i = 0; i < ITERS; i++) {
    const t = performance.now();
    df.mutate({ arr });
    times.push(performance.now() - t);
  }
  console.log(`8. Full mutate({ arr }):                       ${median(times).toFixed(3)}ms`);
}

// 9. Overhead floor: cowStore + createColumnarDataFrameFromStore with empty updates
{
  const { cowStore, createColumnarDataFrameFromStore, preserveDataFrameMetadata } = await import(
    "../../dataframe/ts/dataframe/index.ts"
  );
  const times: number[] = [];
  for (let w = 0; w < 10; w++) {
    const next = cowStore(store, {}, undefined);
    createColumnarDataFrameFromStore(next);
  }
  for (let i = 0; i < ITERS; i++) {
    const t = performance.now();
    const next = cowStore(store, {}, undefined);
    const out = createColumnarDataFrameFromStore(next);
    (out as any).__view = (df as any).__view;
    preserveDataFrameMetadata(out, df);
    times.push(performance.now() - t);
  }
  console.log(`9. cowStore + createFromStore (overhead floor): ${median(times).toFixed(3)}ms`);
}

// 10. filter→mutate (test 17)
{
  const times: number[] = [];
  const filtered = df.filter((r: any) => r.x > 50);
  for (let w = 0; w < 10; w++) filtered.mutate({ z: (r: any) => r.x + r.y });
  for (let i = 0; i < ITERS; i++) {
    const t = performance.now();
    filtered.mutate({ z: (r: any) => r.x + r.y });
    times.push(performance.now() - t);
  }
  console.log(`10. filter→mutate (view path):                 ${median(times).toFixed(3)}ms`);
}

// 11. Ternary (test 18)
{
  const times: number[] = [];
  for (let w = 0; w < 10; w++) df.mutate({ cat: (r: any) => r.x > 50 ? "high" : "low" });
  for (let i = 0; i < ITERS; i++) {
    const t = performance.now();
    df.mutate({ cat: (r: any) => r.x > 50 ? "high" : "low" });
    times.push(performance.now() - t);
  }
  console.log(`11. Full mutate ternary (x>50?high:low):       ${median(times).toFixed(3)}ms`);
}

console.log(`\n--- Polars reference medians ---`);
console.log(`boolean (x>50):     0.030ms`);
console.log(`scalar (42):        0.012ms`);
console.log(`array assign:       0.011ms`);
console.log(`filter→mutate:      0.068ms`);
console.log(`ternary:            0.302ms`);
console.log(`numeric (x+y):      0.064ms`);
console.log("\nDone.");
