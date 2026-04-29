import { createDataFrame } from "@tidy-ts/dataframe";

const N = 100_000;
const ITERS = 100;
function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

const rows = Array.from({ length: N }, (_, i) => ({
  x: Math.random() * 100,
  y: Math.random() * 50,
}));
const df = createDataFrame(rows);

// ---- Isolate each piece of filter→mutate ----

// 1. Just the napi compare (produces Uint8Array)
const { mutate_compare_scalar_raw } = await import("../../dataframe/ts/wasm/sorting-functions.ts");
const store = (df as any).__store;
const xCol = store.columns.x as Float64Array;

for (let w = 0; w < 20; w++) mutate_compare_scalar_raw(xCol, 50, 0);
const t1: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  mutate_compare_scalar_raw(xCol, 50, 0);
  t1.push(performance.now() - t);
}
console.log(`1. napi compare_scalar_raw:           ${median(t1).toFixed(4)}ms`);

// 2. withRawMask (create view object)
const { withRawMask } = await import("../../dataframe/ts/dataframe/implementation/row-cursor.ts");
const rawMask = mutate_compare_scalar_raw(xCol, 50, 0)!;
for (let w = 0; w < 20; w++) withRawMask(df, rawMask);
const t2: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  withRawMask(df, rawMask);
  t2.push(performance.now() - t);
}
console.log(`2. withRawMask:                       ${median(t2).toFixed(4)}ms`);

// 3. materializeIndex from rawMask (the expensive part)
const { materializeIndex } = await import("../../dataframe/ts/dataframe/implementation/columnar-view.ts");

// 3a. Just the count pass
const t3a: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const rm = rawMask;
  const n = rm.length;
  const t = performance.now();
  let count = 0;
  const n8 = n & ~7;
  for (let j = 0; j < n8; j += 8) {
    count += rm[j] + rm[j+1] + rm[j+2] + rm[j+3] + rm[j+4] + rm[j+5] + rm[j+6] + rm[j+7];
  }
  for (let j = n8; j < n; j++) if (rm[j]) count++;
  t3a.push(performance.now() - t);
}
console.log(`3a. count pass (unrolled):            ${median(t3a).toFixed(4)}ms`);

// 3b. Just the Uint32Array allocation
let setCount = 0;
for (let i = 0; i < N; i++) if (rawMask[i]) setCount++;
console.log(`   (${setCount} set bits out of ${N})`);

const t3b: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  const out = new Uint32Array(setCount);
  t3b.push(performance.now() - t);
}
console.log(`3b. new Uint32Array(${setCount}):      ${median(t3b).toFixed(4)}ms`);

// 3c. Just the collect pass (given pre-allocated array)
const preAlloc = new Uint32Array(setCount);
const t3c: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const rm = rawMask;
  const n = rm.length;
  const t = performance.now();
  let k = 0;
  for (let j = 0; j < n; j++) if (rm[j]) preAlloc[k++] = j;
  t3c.push(performance.now() - t);
}
console.log(`3c. collect pass:                     ${median(t3c).toFixed(4)}ms`);

// 3d. Full materializeIndex (both passes + alloc)
const t3d: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const view = { rawMask, _materializedIndex: null as any };
  const t = performance.now();
  materializeIndex(N, view);
  t3d.push(performance.now() - t);
}
console.log(`3d. full materializeIndex:            ${median(t3d).toFixed(4)}ms`);

// 4. napi binary cols (x+y) on full store (no view)
const { mutate_binary_cols } = await import("../../dataframe/ts/wasm/sorting-functions.ts");
const yCol = store.columns.y as Float64Array;
for (let w = 0; w < 20; w++) mutate_binary_cols(xCol, yCol, 0);
const t4: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  mutate_binary_cols(xCol, yCol, 0);
  t4.push(performance.now() - t);
}
console.log(`4. napi binary_cols (x+y, 100K):      ${median(t4).toFixed(4)}ms`);

// 5. cowStore (copy-on-write store creation)
const { cowStore } = await import("../../dataframe/ts/dataframe/index.ts");
const result4 = mutate_binary_cols(xCol, yCol, 0)!;
for (let w = 0; w < 20; w++) cowStore(store, { z: result4 as unknown as unknown[] });
const t5: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  cowStore(store, { z: result4 as unknown as unknown[] });
  t5.push(performance.now() - t);
}
console.log(`5. cowStore:                          ${median(t5).toFixed(4)}ms`);

// 6. createColumnarDataFrameFromStore
const { createColumnarDataFrameFromStore } = await import("../../dataframe/ts/dataframe/index.ts");
const nextStore = cowStore(store, { z: result4 as unknown as unknown[] });
for (let w = 0; w < 20; w++) createColumnarDataFrameFromStore(nextStore);
const t6: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  createColumnarDataFrameFromStore(nextStore);
  t6.push(performance.now() - t);
}
console.log(`6. createColumnarDataFrameFromStore:  ${median(t6).toFixed(4)}ms`);

// 7. Full filter→mutate end-to-end
for (let w = 0; w < 20; w++) df.filter((r: any) => r.x > 50).mutate({ z: (r: any) => r.x + r.y });
const t7: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  df.filter((r: any) => r.x > 50).mutate({ z: (r: any) => r.x + r.y });
  t7.push(performance.now() - t);
}
console.log(`\n7. TOTAL filter→mutate:               ${median(t7).toFixed(4)}ms`);
console.log(`   sum of parts: ${(median(t1) + median(t2) + median(t3d) + median(t4) + median(t5) + median(t6)).toFixed(4)}ms`);
console.log(`   Polars:                            0.0680ms`);
