import {
  mutate_binary_cols,
  mutate_binary_cols_masked,
} from "../../dataframe/ts/wasm/sorting-functions.ts";

const N = 100_000;
const ITERS = 200;
function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

const a = new Float64Array(N);
const b = new Float64Array(N);
const mask = new Uint8Array(N);
for (let i = 0; i < N; i++) {
  a[i] = Math.random() * 100;
  b[i] = Math.random() * 50;
  mask[i] = Math.random() > 0.5 ? 1 : 0;
}

// Warmup
for (let w = 0; w < 50; w++) {
  mutate_binary_cols(a, b, 0);
  mutate_binary_cols_masked(a, b, 0, mask);
}

// Unmasked (full 100K)
const t1: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  mutate_binary_cols(a, b, 0);
  t1.push(performance.now() - t);
}
console.log(`unmasked binary_cols(100K):      ${median(t1).toFixed(4)}ms`);

// Masked (100K with ~50% mask)
const t2: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  mutate_binary_cols_masked(a, b, 0, mask);
  t2.push(performance.now() - t);
}
console.log(`masked binary_cols(100K, ~50%):  ${median(t2).toFixed(4)}ms`);

// Gather + unmasked on ~50K
const setCount = mask.reduce((s, v) => s + v, 0);
const ga = new Float64Array(setCount);
const gb = new Float64Array(setCount);
let k = 0;
for (let i = 0; i < N; i++) {
  if (mask[i]) {
    ga[k] = a[i];
    gb[k] = b[i];
    k++;
  }
}
const t3: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  mutate_binary_cols(ga, gb, 0);
  t3.push(performance.now() - t);
}
console.log(`unmasked binary_cols(${setCount}):  ${median(t3).toFixed(4)}ms`);
