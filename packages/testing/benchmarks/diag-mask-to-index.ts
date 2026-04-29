import { mask_to_index } from "../../dataframe/ts/wasm/sorting-functions.ts";

const mask = new Uint8Array([0, 1, 0, 1, 1, 0, 0, 1]);
const result = mask_to_index(mask);
console.log("mask_to_index result:", result);
console.log("expected: [1, 3, 4, 7]");
console.log("napi available:", result !== null);

// Benchmark: 100K mask, 50% set
const N = 100_000;
const bigMask = new Uint8Array(N);
for (let i = 0; i < N; i++) bigMask[i] = Math.random() > 0.5 ? 1 : 0;

const ITERS = 200;
const times: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  mask_to_index(bigMask);
  times.push(performance.now() - t);
}
times.sort((a, b) => a - b);
console.log(`napi mask_to_index (100K, 50%): median ${times[Math.floor(ITERS/2)].toFixed(4)}ms`);

// JS fallback benchmark for comparison
const times2: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  let count = 0;
  const n8 = N & ~7;
  for (let j = 0; j < n8; j += 8) {
    count += (bigMask[j] + bigMask[j+1] + bigMask[j+2] + bigMask[j+3] +
              bigMask[j+4] + bigMask[j+5] + bigMask[j+6] + bigMask[j+7]);
  }
  for (let j = n8; j < N; j++) if (bigMask[j]) count++;
  const out = new Uint32Array(count);
  let k = 0;
  for (let j = 0; j < N; j++) if (bigMask[j]) out[k++] = j;
  times2.push(performance.now() - t);
}
times2.sort((a, b) => a - b);
console.log(`JS collect fallback (100K, 50%): median ${times2[Math.floor(ITERS/2)].toFixed(4)}ms`);
