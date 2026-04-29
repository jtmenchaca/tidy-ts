import { createDataFrame } from "@tidy-ts/dataframe";
import { cowStore } from "../../dataframe/ts/dataframe/implementation/row-cursor.ts";
import { createColumnarDataFrameFromStore } from "../../dataframe/ts/dataframe/implementation/create-dataframe.ts";
import { preserveDataFrameMetadata } from "../../dataframe/ts/dataframe/implementation/with-groups.ts";

const N = 100_000;
const ITERS = 200;
function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

const rows = Array.from({ length: N }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 50,
}));
const df = createDataFrame(rows);
const store = (df as any).__store;
const resultCol = new Float64Array(N);
for (let i = 0; i < N; i++) resultCol[i] = store.columns.x[i] + store.columns.y[i];

// 1. cowStore
const t1: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  cowStore(store, { z: resultCol as unknown as unknown[] });
  t1.push(performance.now() - t);
}
console.log(`1. cowStore:                          ${median(t1).toFixed(4)}ms`);

// 2. createColumnarDataFrameFromStore
const nextStore = cowStore(store, { z: resultCol as unknown as unknown[] });
const t2: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  createColumnarDataFrameFromStore(nextStore);
  t2.push(performance.now() - t);
}
console.log(`2. createColumnarDataFrameFromStore:  ${median(t2).toFixed(4)}ms`);

// 3. preserveDataFrameMetadata
const out = createColumnarDataFrameFromStore(nextStore);
const t3: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  preserveDataFrameMetadata(out, df);
  t3.push(performance.now() - t);
}
console.log(`3. preserveDataFrameMetadata:         ${median(t3).toFixed(4)}ms`);

// 4. Full createUpdatedDataFrame equivalent (all 3 steps)
const t4: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  const ns = cowStore(store, { z: resultCol as unknown as unknown[] });
  const o = createColumnarDataFrameFromStore(ns);
  (o as any).__view = (df as any).__view;
  preserveDataFrameMetadata(o, df);
  t4.push(performance.now() - t);
}
console.log(`4. full createUpdatedDataFrame:       ${median(t4).toFixed(4)}ms`);

// 5. Proxy creation overhead (the columnar-proxy.ts wrapper)
const { createColumnarProxy } = await import("../../dataframe/ts/dataframe/implementation/columnar-proxy.ts");
const t5: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const inner = createColumnarDataFrameFromStore(nextStore);
  const t = performance.now();
  createColumnarProxy(inner as any);
  t5.push(performance.now() - t);
}
console.log(`5. createColumnarProxy:               ${median(t5).toFixed(4)}ms`);

console.log(`\nsum(1+2+3): ${(median(t1) + median(t2) + median(t3)).toFixed(4)}ms`);
