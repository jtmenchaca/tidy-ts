import { createDataFrame } from "@tidy-ts/dataframe";
import { materializeIndex, bitsetFromMask, createBitSet, bitsetSet } from "../../dataframe/ts/dataframe/implementation/columnar-view.ts";

const N = 100_000;
const ITERS = 100;
function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

// Create a rawMask (~50% set)
const rawMask = new Uint8Array(N);
for (let i = 0; i < N; i++) rawMask[i] = Math.random() > 0.5 ? 1 : 0;

// Create bitset from rawMask
const bs = bitsetFromMask(rawMask);

// Test 1: materializeIndex from rawMask
const t1: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const view = { rawMask, _materializedIndex: null as any };
  const t = performance.now();
  materializeIndex(N, view);
  t1.push(performance.now() - t);
}
console.log(`materializeIndex (rawMask):  ${median(t1).toFixed(3)}ms`);

// Test 2: materializeIndex from bitset
const t2: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const view = { mask: bs, _materializedIndex: null as any };
  const t = performance.now();
  materializeIndex(N, view);
  t2.push(performance.now() - t);
}
console.log(`materializeIndex (bitset):   ${median(t2).toFixed(3)}ms`);

// Test 3: bitsetFromMask + materializeIndex from bitset
const t3: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const bsCopy = bitsetFromMask(rawMask);
  const view = { mask: bsCopy, _materializedIndex: null as any };
  const t = performance.now();
  materializeIndex(N, view);
  t3.push(performance.now() - t);
}
console.log(`materializeIndex (bitset, incl fromMask): measured separately`);

// Test 4: just bitsetFromMask
const t4: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  bitsetFromMask(rawMask);
  t4.push(performance.now() - t);
}
console.log(`bitsetFromMask:              ${median(t4).toFixed(3)}ms`);
console.log(`bitsetFromMask + materialize: ${(median(t4) + median(t2)).toFixed(3)}ms`);
